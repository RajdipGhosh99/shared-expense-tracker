import { z } from 'zod';
/**
 * Individual receipt or line item in a screenshot / invoice
 */
export declare const receiptItemSchema: z.ZodObject<{
    vendorName: z.ZodString;
    totalAmount: z.ZodNumber;
    paymentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    date: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    isOcrProcessed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type ReceiptItem = z.infer<typeof receiptItemSchema>;
/**
 * Shared Receipt Schema for frontend consumption and validation.
 * Supports single receipt or multiple bills extracted from a single screenshot.
 */
export declare const receiptSchema: z.ZodObject<{
    isValidReceipt: z.ZodBoolean;
    rejectionReason: z.ZodNullable<z.ZodString>;
    vendorName: z.ZodString;
    totalAmount: z.ZodNumber;
    paymentId: z.ZodNullable<z.ZodString>;
    date: z.ZodString;
    isOcrProcessed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    items: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        vendorName: z.ZodString;
        totalAmount: z.ZodNumber;
        paymentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        date: z.ZodString;
        category: z.ZodOptional<z.ZodString>;
        isOcrProcessed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
export type ReceiptExtraction = z.infer<typeof receiptSchema>;
export interface ReceiptExtractionApiResponse {
    success: boolean;
    data: ReceiptExtraction;
    meta: {
        sha256: string;
        isDuplicateFile: boolean;
        isDuplicateTransaction?: boolean;
        duplicateMessage?: string;
        processingTimeMs: number;
    };
}
//# sourceMappingURL=receiptSchema.d.ts.map