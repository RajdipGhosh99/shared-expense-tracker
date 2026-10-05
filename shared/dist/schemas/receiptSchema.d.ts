import { z } from 'zod';
/**
 * Shared Receipt Schema for frontend consumption and validation.
 */
export declare const receiptSchema: z.ZodObject<{
    isValidReceipt: z.ZodBoolean;
    rejectionReason: z.ZodNullable<z.ZodString>;
    vendorName: z.ZodString;
    totalAmount: z.ZodNumber;
    paymentId: z.ZodNullable<z.ZodString>;
    date: z.ZodString;
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