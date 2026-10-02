import { FlatBalanceSheet } from '../types/index.js';
export interface ExpenseRecord {
  payerEmail: string;
  splits: Record<string, number>;
}
export interface SettlementRecord {
  payerEmail: string;
  receiverEmail: string;
  amountMinorUnits: number;
}
export interface MemberLookup {
  email: string;
  name: string;
  upiId?: string;
}
/**
 * Greedy Min-Cash-Flow Algorithm for Flatmate Debt Simplification.
 * Minimizes the number of peer-to-peer transfers from O(N^2) to at most N - 1.
 */
export declare function simplifyDebts(
  flatId: string,
  members: MemberLookup[],
  expenses: ExpenseRecord[],
  settlements: SettlementRecord[],
): FlatBalanceSheet;
//# sourceMappingURL=debtEngine.d.ts.map
