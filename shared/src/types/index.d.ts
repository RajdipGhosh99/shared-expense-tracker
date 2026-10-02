export type MemberRole = 'ADMIN' | 'MEMBER';
export interface User {
    id: string;
    email: string;
    name: string;
    upiId?: string;
    avatarUrl?: string;
    createdAt: string;
}
export interface FlatMember {
    id: string;
    flatId: string;
    userEmail: string;
    name: string;
    upiId?: string;
    role: MemberRole;
    isAway?: boolean;
    awayUntil?: string;
    joinedAt: string;
}
export interface Flat {
    id: string;
    name: string;
    inviteCode: string;
    currency: string;
    createdAt: string;
}
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';
export type ExpenseCategory = 'Groceries' | 'Rent' | 'Electricity' | 'Wi-Fi' | 'Maid & Cook' | 'Drinking Water' | 'Household' | 'Food & Dining' | 'Other';
export interface ExpenseSplit {
    userEmail: string;
    amountMinorUnits: number;
    amountDisplay: number;
    percentage?: number;
}
export interface Expense {
    id: string;
    flatId: string;
    payerEmail: string;
    title: string;
    totalAmountMinorUnits: number;
    totalAmountDisplay: number;
    category: ExpenseCategory;
    splitType: SplitType;
    splits: Record<string, number>;
    utrNumber?: string;
    overwrittenFlag: 'YES' | 'NO';
    originalExpenseId?: string;
    duplicateOfId?: string;
    sheetRowIndex?: number;
    sheetRowLink?: string;
    historyLog?: string;
    sheetSyncStatus: 'SYNCED' | 'PENDING' | 'FAILED';
    createdAt: string;
    updatedAt: string;
}
export type DuplicateType = 'EXACT_UTR' | 'FUZZY_FINGERPRINT';
export interface DuplicateConflictResponse {
    status: 'DUPLICATE_DETECTED';
    duplicateType: DuplicateType;
    message: string;
    existingRecord: {
        id: string;
        title: string;
        amountDisplay: number;
        payerEmail: string;
        createdAt: string;
        utrNumber?: string;
        sheetUrl?: string;
    };
    incomingRecord: {
        title: string;
        amountDisplay: number;
        payerEmail: string;
        utrNumber?: string;
    };
}
export interface Settlement {
    id: string;
    flatId: string;
    payerEmail: string;
    receiverEmail: string;
    amountMinorUnits: number;
    amountDisplay: number;
    notes?: string;
    settledAt: string;
}
export interface SimplifiedDebtTransaction {
    fromUserEmail: string;
    toUserEmail: string;
    amountMinorUnits: number;
    amountDisplay: number;
    receiverUPI?: string;
    receiverName?: string;
}
export interface FlatBalanceSheet {
    flatId: string;
    netBalances: Record<string, number>;
    simplifiedDebts: SimplifiedDebtTransaction[];
}
export interface StatementCategorySummary {
    category: string;
    amountDisplay: number;
    percentage: number;
}
export interface StatementMemberSummary {
    userEmail: string;
    userName: string;
    totalPaidDisplay: number;
    totalShareDisplay: number;
    netBalanceDisplay: number;
}
export interface MonthlyStatement {
    flatId: string;
    flatName: string;
    periodLabel: string;
    startDate: string;
    endDate: string;
    totalSpendDisplay: number;
    categoryBreakdown: StatementCategorySummary[];
    memberSummaries: StatementMemberSummary[];
    expensesCount: number;
    settlementsCount: number;
    createdAt: string;
}
export interface ExtractedReceiptResult {
    amountDisplay: number;
    amountMinorUnits: number;
    merchant: string;
    category: ExpenseCategory;
    utrNumber?: string;
    rawText?: string;
    extractedAt: string;
}
//# sourceMappingURL=index.d.ts.map