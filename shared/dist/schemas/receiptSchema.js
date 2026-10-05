import { z } from 'zod';
/**
 * Shared Receipt Schema for frontend consumption and validation.
 */
export const receiptSchema = z.object({
    isValidReceipt: z
        .boolean()
        .describe('True if this document is a legible, valid financial receipt or payment proof; false otherwise.'),
    rejectionReason: z
        .string()
        .nullable()
        .describe('Null if valid receipt. Otherwise, reason for rejection.'),
    vendorName: z
        .string()
        .describe('Normalized name of the merchant, store, or payee.'),
    totalAmount: z
        .number()
        .describe('Final transaction total amount as a positive number in currency units.'),
    paymentId: z
        .string()
        .nullable()
        .describe('12-digit UPI UTR, bank reference number, or transaction ID if visible.'),
    date: z
        .string()
        .describe('Transaction date in ISO format YYYY-MM-DD.'),
    isOcrProcessed: z
        .boolean()
        .optional()
        .default(true)
        .describe('Indicates that this expense entry was extracted and verified by Multimodal AI/OCR.'),
});
//# sourceMappingURL=receiptSchema.js.map