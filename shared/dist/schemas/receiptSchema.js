import { z } from 'zod';
/**
 * Individual receipt or line item in a screenshot / invoice
 */
export const receiptItemSchema = z.object({
    vendorName: z
        .string()
        .describe('Normalized name of the merchant, store, or payee (e.g. Swiggy, Blinkit, Dmart, BESCOM).'),
    totalAmount: z
        .number()
        .describe('Transaction total amount as a positive number in currency units.'),
    paymentId: z
        .string()
        .nullable()
        .optional()
        .describe('12-digit UPI UTR, bank reference number, or transaction ID if visible.'),
    date: z
        .string()
        .describe('Transaction date in ISO format YYYY-MM-DD. Empty string if unreadable.'),
    category: z
        .string()
        .optional()
        .describe('Suggested category for this bill or item.'),
    isOcrProcessed: z
        .boolean()
        .optional()
        .default(true)
        .describe('Indicates that this expense entry was extracted and verified by Multimodal AI/OCR.'),
});
/**
 * Shared Receipt Schema for frontend consumption and validation.
 * Supports single receipt or multiple bills extracted from a single screenshot.
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
        .describe('Primary merchant or overview vendor name.'),
    totalAmount: z
        .number()
        .describe('Final aggregate or single transaction total amount.'),
    paymentId: z
        .string()
        .nullable()
        .describe('Primary UPI UTR or payment reference ID if visible.'),
    date: z
        .string()
        .describe('Transaction date in ISO format YYYY-MM-DD.'),
    isOcrProcessed: z
        .boolean()
        .optional()
        .default(true)
        .describe('Indicates that this expense entry was extracted and verified by Multimodal AI/OCR.'),
    items: z
        .array(receiptItemSchema)
        .optional()
        .default([])
        .describe('List of distinct bills, payments, or itemized transactions detected in the screenshot.'),
});
//# sourceMappingURL=receiptSchema.js.map