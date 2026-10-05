import { Router } from 'express';
import receiptExtractionRoutes from './receiptExtractionRoutes.js';

const router = Router();

// Forward /extract, /receipts/extract directly to the unified Multimodal Extraction handler
router.use(receiptExtractionRoutes);

export default router;
