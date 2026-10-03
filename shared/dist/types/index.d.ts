export type MemberRole = 'ADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT';
export interface User {
    id: string;
    email: string;
    name: string;
    upiId?: string;
    avatarUrl?: string;
    createdAt: string;
}
export interface GroupMember {
    id: string;
    groupId: string;
    flatId?: string;
    userEmail: string;
    name: string;
    upiId?: string;
    role: MemberRole;
    status?: MemberStatus;
    isAway?: boolean;
    awayUntil?: string;
    joinedAt: string;
    movedInAt?: string;
    movedOutAt?: string;
}
export interface UserGroupMembership {
    group: Group;
    flat: Group;
    role: MemberRole;
    status: MemberStatus;
    joinedAt: string;
}
export type FlatMember = GroupMember;
export type FieldControlMode = 'mandatory' | 'editable' | 'view_only' | 'hidden';
export interface GroupFormControls {
    amount: FieldControlMode;
    title: FieldControlMode;
    date: FieldControlMode;
    category: FieldControlMode;
    subCategory: FieldControlMode;
    splitType: FieldControlMode;
    notes: FieldControlMode;
}
export declare const DEFAULT_GROUP_FORM_CONTROLS: GroupFormControls;
export interface Group {
    id: string;
    name: string;
    inviteCode: string;
    currency: string;
    googleSheetSync?: boolean;
    formControls?: GroupFormControls;
    createdAt: string;
}
export type Flat = Group;
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';
export type ExpenseCategory = 'Food & Dining' | 'Bills & Utilities' | 'Transit & Travel' | 'Shopping & Lifestyle' | 'Entertainment & Leisure' | 'Health & Wellness' | 'Education & Work' | 'Transfers & Adjustments' | 'Other' | 'Shopping & E-Commerce' | 'Health & Well-being' | 'Education & Career' | 'Transfers & Settlements';
export declare const CATEGORY_TAXONOMY: Record<string, string[]>;
export interface SplitDynamicInfo {
    splitDynamic: string;
    defaultSplitType: SplitType;
    isExpense: boolean;
}
export declare const CATEGORY_SPLIT_DYNAMIC: Record<string, SplitDynamicInfo>;
export interface ExpenseSplit {
    userEmail: string;
    amountMinorUnits: number;
    amountDisplay: number;
    percentage?: number;
}
export interface Expense {
    id: string;
    groupId: string;
    flatId?: string;
    payerEmail: string;
    title: string;
    date: string;
    expenseDate?: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    totalAmountMinorUnits: number;
    totalAmountDisplay: number;
    category: ExpenseCategory;
    subCategory?: string;
    notes?: string;
    isExpense?: boolean;
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
export type GroupInviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
export interface GroupInvite {
    id: string;
    groupId: string;
    inviteCode: string;
    inviteeName: string;
    inviteeEmail: string;
    effectiveMoveInDate: string;
    createdBy: string;
    status: GroupInviteStatus;
    expiresAt: string;
    createdAt: string;
}
export type EligibilityStatus = 'ACTIVE' | 'NOT_YET_MOVED_IN' | 'MOVED_OUT' | 'PENDING_INVITE';
export interface EligibleMember {
    userEmail: string;
    name: string;
    upiId?: string;
    role: MemberRole;
    movedInAt: string;
    movedOutAt?: string;
    isAway?: boolean;
    isPendingInvite?: boolean;
    effectiveMoveInDate?: string;
    eligibilityStatus: EligibilityStatus;
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
    groupId: string;
    flatId?: string;
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
    upiLink?: string;
}
export interface GroupBalanceSheet {
    groupId: string;
    flatId?: string;
    netBalances: Record<string, number>;
    simplifiedDebts: SimplifiedDebtTransaction[];
}
export type FlatBalanceSheet = GroupBalanceSheet;
export interface StatementSubcategorySummary {
    subCategory: string;
    amountDisplay: number;
    percentage: number;
}
export interface StatementCategorySummary {
    category: string;
    amountDisplay: number;
    percentage: number;
    subcategories?: StatementSubcategorySummary[];
}
export interface StatementMemberSummary {
    userEmail: string;
    userName: string;
    totalPaidDisplay: number;
    totalShareDisplay: number;
    netBalanceDisplay: number;
}
export interface MonthlyStatement {
    groupId: string;
    groupName: string;
    flatId?: string;
    flatName?: string;
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
    subCategory?: string;
    utrNumber?: string;
    rawText?: string;
    extractedAt: string;
}
//# sourceMappingURL=index.d.ts.map