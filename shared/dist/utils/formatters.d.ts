import { MonthlyStatement } from '../types/index.js';
/**
 * Formats minor units (paise) into INR currency display (e.g. ₹1,450.50).
 */
export declare function formatINR(minorUnits: number): string;
/**
 * Generates UPI Deep Link for instant 1-tap settlement via GPay / PhonePe / Paytm / BHIM.
 */
export declare function generateUPIDeepLink(params: {
    receiverUPI: string;
    receiverName: string;
    amountMinorUnits: number;
    note?: string;
}): string;
/**
 * Generates a clean, emoji-formatted WhatsApp digest message for the group.
 */
export declare function formatWhatsAppMonthlyDigest(statement: MonthlyStatement, appUrl?: string): string;
//# sourceMappingURL=formatters.d.ts.map