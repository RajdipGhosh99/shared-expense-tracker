import { z } from 'zod';
import { Type, Schema } from '@google/genai';

/**
 * ---------------------------------------------------------------------------
 * Part 1: Shared Schema (Runtime Zod Validator + Gemini ResponseSchema)
 * ---------------------------------------------------------------------------
 * Enforces strict runtime data typing and document guardrails for Multimodal
 * AI Receipt Extraction.
 *
 * Guardrail Behavior:
 * - If the file is NOT a valid financial receipt (e.g., selfie, blank, blurry, random photo):
 *     isValidReceipt: false
 *     rejectionReason: "NOT_A_RECEIPT" | "BLURRY_OR_ILLEGIBLE" | "INCOMPLETE_PROOF" | "CORRUPTED"
 *     vendorName: ""
 *     totalAmount: 0
 *     paymentId: null
 *     date: ""
 * - If the file is a valid receipt:
 *     isValidReceipt: true
 *     rejectionReason: null
 *     vendorName: "Swiggy" / "Blinkit" / "BESCOM" / etc.
 *     totalAmount: 420.50
 *     paymentId: "427819283719" (UPI UTR / Bank Ref ID)
 *     date: "2026-10-05" (ISO YYYY-MM-DD)
 */

export const receiptSchema = z.object({
  isValidReceipt: z
    .boolean()
    .describe('True if this document is a legible, valid financial receipt or payment proof; false otherwise.'),
  rejectionReason: z
    .string()
    .nullable()
    .describe('Null if valid receipt. Otherwise, reason for rejection (e.g., NOT_A_RECEIPT, BLURRY_OR_ILLEGIBLE, INCOMPLETE_PROOF).'),
  vendorName: z
    .string()
    .describe('Normalized name of the merchant, store, biller, or payee (e.g. Swiggy, Blinkit, Dmart, BESCOM). Empty string if rejected.'),
  totalAmount: z
    .number()
    .describe('Final transaction total amount as a positive number in currency units. 0 if rejected.'),
  paymentId: z
    .string()
    .nullable()
    .describe('12-digit UPI UTR, bank reference number, transaction ID, or order ID if visible on the receipt; null if absent or rejected.'),
  date: z
    .string()
    .describe('Transaction date in ISO format YYYY-MM-DD. Empty string if unreadable or rejected.'),
});

export type ReceiptExtraction = z.infer<typeof receiptSchema>;

/**
 * Gemini Response Schema using official @google/genai Type definitions.
 * This is injected directly into `generationConfig.responseSchema` to guarantee
 * deterministic, structured JSON output matching the Zod contract.
 */
export const geminiReceiptResponseSchema: Schema = {
  type: Type.OBJECT,
  description: 'Structured multimodal extraction of financial receipts with document validity guardrails.',
  properties: {
    isValidReceipt: {
      type: Type.BOOLEAN,
      description: 'Set to true ONLY if the document is an authentic, legible payment receipt, invoice, or UPI payment screenshot. Set to false if it is a random photo, selfie, blurry document, or non-financial item.',
    },
    rejectionReason: {
      type: Type.STRING,
      description: 'If isValidReceipt is false, provide an uppercase reason code such as NOT_A_RECEIPT, BLURRY_OR_ILLEGIBLE, INCOMPLETE_PROOF, or CORRUPTED. Must be null if isValidReceipt is true.',
      nullable: true,
    },
    vendorName: {
      type: Type.STRING,
      description: 'Clean merchant, store, utility provider, or receiver name (e.g. Swiggy, Zepto, Dmart, BESCOM, Amazon, Ramesh Kumar). Provide empty string if rejected.',
    },
    totalAmount: {
      type: Type.NUMBER,
      description: 'The final amount paid as a positive floating point number. Do not include currency symbols. Provide 0 if rejected.',
    },
    paymentId: {
      type: Type.STRING,
      description: 'The 12-digit UPI UTR number, bank reference number, or transaction ID if visible; null if absent or rejected.',
      nullable: true,
    },
    date: {
      type: Type.STRING,
      description: 'The transaction date formatted as YYYY-MM-DD. Provide empty string if date is not readable or document is rejected.',
    },
  },
  required: ['isValidReceipt', 'vendorName', 'totalAmount', 'date'],
};
