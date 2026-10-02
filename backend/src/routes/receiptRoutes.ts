import { Router, Request, Response } from 'express';
import multer from 'multer';
import { extractReceiptFromImage } from '../ocr/receiptExtractor.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// Upload Screenshot -> OCR Extracted JSON
router.post(
  '/extract',
  authMiddleware,
  upload.single('receipt'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No screenshot/image file provided.' });
    }

    try {
      const result = await extractReceiptFromImage(
        req.file.buffer,
        req.file.mimetype
      );
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to process screenshot: ' + err.message });
    }
  }
);

export default router;
