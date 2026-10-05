import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { receiptSchema, geminiReceiptResponseSchema, ReceiptExtraction } from '../schemas/receiptSchema.js';

const router = Router();

/**
 * In-memory LRU / Map for file-level SHA-256 deduplication.
 * In a multi-instance serverless deployment, this cache can be backed by Redis or
 * a SQLite/Postgres `receipt_file_hashes` table to drop duplicate uploads before
 * calling Gemini.
 */
interface CachedExtraction {
  data: ReceiptExtraction;
  createdAt: number;
}
const fileHashCache = new Map<string, CachedExtraction>();

// Clean entries older than 24 hours to prevent memory leaks
const HASH_TTL_MS = 24 * 60 * 60 * 1000;
function cleanExpiredHashes() {
  const now = Date.now();
  for (const [hash, entry] of fileHashCache.entries()) {
    if (now - entry.createdAt > HASH_TTL_MS) {
      fileHashCache.delete(hash);
    }
  }
}

/**
 * Multer Configuration:
 * 100% Serverless-Safe Memory Storage.
 * Incoming files are captured strictly as in-memory Buffers (req.file.buffer).
 * ZERO intermediate disk files, zero /tmp bloat, zero cleanup cron jobs needed.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an image (JPEG, PNG, WebP) or PDF receipt.'));
    }
  },
});

/**
 * Multimodal Prompt instructing Gemini on Document Guardrails and Extraction Rules.
 */
const RECEIPT_EXTRACTION_SYSTEM_PROMPT = `You are a high-precision financial OCR and document verification engine.
Analyze the provided document (payment receipt, invoice, UPI screenshot, statement, or bill).

STRICT DOCUMENT GUARDRAILS:
1. Verify if this is an authentic, legible financial receipt or payment proof.
2. If the document is NOT a financial receipt (e.g. selfie, random photo, landscape, animal, blank document, blurry unreadable image, or non-payment screenshot):
   - Set isValidReceipt: false
   - Set rejectionReason: one of "NOT_A_RECEIPT", "BLURRY_OR_ILLEGIBLE", "INCOMPLETE_PROOF", or "CORRUPTED"
   - Set vendorName: ""
   - Set totalAmount: 0
   - Set paymentId: null
   - Set date: ""
   - Set items: []
3. If this IS a valid receipt or payment screenshot:
   - Set isValidReceipt: true
   - Set rejectionReason: null
   - Extract the primary vendorName, totalAmount, paymentId, and date.
   - MULTI-BILL DETECTION: Some screenshots contain MULTIPLE separate bills or transactions (e.g., a statement showing 2 or more UPI transactions, a split payment, or multiple receipts combined into one image).
     * If MULTIPLE bills are present in the image, extract EACH individual transaction separately into the "items" array with its own vendorName, totalAmount, paymentId, date, and category.
     * If only ONE bill is present, include that single bill as the 1 element in "items".

Output ONLY valid JSON adhering strictly to the responseSchema. Zero Markdown code fences.`;

/**
 * Part 3: Node.js Backend Route
 * Unified Multimodal AI Receipt Extraction Endpoint:
 * Handles POST /api/extract-receipt, POST /extract-receipt, and POST /api/receipts/extract
 */
router.post(
  ['/extract-receipt', '/receipts/extract', '/extract'],
  upload.single('receipt'),
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      // 1. RECEIVE: Ensure file was captured in memory buffer
      const file = req.file;
      if (!file || !file.buffer) {
        res.status(400).json({
          success: false,
          error: 'No receipt file uploaded. Please send a multipart/form-data file under field "receipt".',
        });
        return;
      }

      // 2. DEDUPLICATION (File-Level SHA-256 Hash):
      // Generate SHA-256 hash of the in-memory buffer before calling the Gemini API.
      // In production, query your database (e.g. `SELECT data FROM receipt_hashes WHERE hash = ?`)
      // to drop identical uploads early, saving quota and reducing latency to < 5ms.
      const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

      cleanExpiredHashes();
      const cached = fileHashCache.get(sha256);
      if (cached) {
        res.json({
          success: true,
          data: cached.data,
          meta: {
            sha256,
            isDuplicateFile: true,
            processingTimeMs: Date.now() - startTime,
          },
        });
        return;
      }

      // 3. AI PROCESSING: Initialize official @google/genai SDK with resilient multi-model cascade
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY environment variable is not configured on the server.',
        });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      // Convert buffer directly to Base64 (zero-disk streaming)
      const base64Data = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';

      const candidateModels = [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.5-flash',
      ];

      let responseText: string | undefined;
      let lastAiError: any = null;

      for (const modelCandidate of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: RECEIPT_EXTRACTION_SYSTEM_PROMPT },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: geminiReceiptResponseSchema,
              temperature: 0.1, // Near-zero temperature for deterministic extraction
            },
          });

          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          lastAiError = err;
          console.warn(`[ReceiptExtractionRoute] Model ${modelCandidate} failed (${err.status || err.message}), trying next candidate...`);
        }
      }

      if (!responseText) {
        res.status(502).json({
          success: false,
          error: `Gemini vision models unavailable: ${lastAiError?.message || 'Empty response'}`,
        });
        return;
      }

      // 4. VALIDATION LAYER (Strict Runtime Zod Validation):
      // Parse raw JSON and validate against receiptSchema to guarantee zero type drift.
      let rawParsedJson: unknown;
      try {
        rawParsedJson = JSON.parse(responseText.trim());
      } catch (jsonErr: any) {
        res.status(502).json({
          success: false,
          error: `Model returned malformed JSON: ${jsonErr.message}`,
        });
        return;
      }

      const zodValidation = receiptSchema.safeParse(rawParsedJson);
      if (!zodValidation.success) {
        res.status(502).json({
          success: false,
          error: 'AI extraction drifted from expected contract schema.',
          details: zodValidation.error.format(),
        });
        return;
      }

      const validatedData = {
        ...zodValidation.data,
        isOcrProcessed: zodValidation.data.isValidReceipt ? true : false,
      };

      // 5. CACHE DEDUPLICATION HASH:
      // Cache verified result against SHA-256 hash
      fileHashCache.set(sha256, {
        data: validatedData,
        createdAt: Date.now(),
      });

      // 6. RETURN: Send validated JSON to client
      // Supports both new schema `{ success: true, data: validatedData, meta: ... }`
      // AND direct legacy schema `{ merchant, amountDisplay, category, utrNumber, items, ... }`
      // so any caller on /extract, /extract-receipt, or /receipts/extract gets a unified, rich response.
      const legacyMerchant = validatedData.vendorName || (validatedData.items && validatedData.items[0]?.vendorName) || 'Shared Expense';
      const legacyAmount = validatedData.totalAmount || (validatedData.items && validatedData.items[0]?.totalAmount) || 0;
      const legacyUtr = validatedData.paymentId || (validatedData.items && validatedData.items[0]?.paymentId) || undefined;
      const isMultipleBills = Boolean(validatedData.items && validatedData.items.length > 1);

      res.json({
        success: true,
        data: validatedData,
        meta: {
          sha256,
          isDuplicateFile: false,
          processingTimeMs: Date.now() - startTime,
        },
        // Direct top-level fields for backwards compatibility with any client callers expecting direct JSON:
        merchant: legacyMerchant,
        amountDisplay: legacyAmount,
        amountMinorUnits: Math.round(legacyAmount * 100),
        category: (validatedData.items && validatedData.items[0]?.category) || 'Food & Dining',
        utrNumber: legacyUtr,
        date: validatedData.date,
        isMultipleBills,
        isOcrProcessed: validatedData.isOcrProcessed,
        isValidReceipt: validatedData.isValidReceipt,
        rejectionReason: validatedData.rejectionReason,
        items: validatedData.items?.map((it) => ({
          merchant: it.vendorName,
          amountDisplay: it.totalAmount,
          amountMinorUnits: Math.round(it.totalAmount * 100),
          category: it.category || 'Food & Dining',
          utrNumber: it.paymentId || undefined,
          date: it.date,
        })),
        extractedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[ReceiptExtraction] Error processing receipt:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'An unexpected error occurred during receipt extraction.',
      });
    }
  },
);

export default router;
