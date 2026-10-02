import { SplitType } from '../types/index.js';
export interface SplitRequest {
  totalAmountMinorUnits: number;
  splitType: SplitType;
  payerEmail: string;
  memberEmails: string[];
  absentMemberEmails?: string[];
  exactAmountsMinorUnits?: Record<string, number>;
  percentages?: Record<string, number>;
  shares?: Record<string, number>;
}
export interface SplitResult {
  splits: Record<string, number>;
  isValid: boolean;
  errorMessage?: string;
}
/**
 * Calculates exact split allocations using integer minor units (paise/cents)
 * to guarantee 0.00% floating point drift and exact sum balance.
 */
export declare function calculateSplits(request: SplitRequest): SplitResult;
//# sourceMappingURL=splitEngine.d.ts.map
