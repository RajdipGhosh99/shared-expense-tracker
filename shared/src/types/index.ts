// ==========================================
// User & Member Models
// ==========================================
export type MemberRole = 'ADMIN' | 'MEMBER';

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
  flatId?: string; // Backwards-compatible alias
  userEmail: string;
  name: string;
  upiId?: string;
  role: MemberRole;
  isAway?: boolean; // Vacation / Absence mode
  awayUntil?: string;
  joinedAt: string;
}

export type FlatMember = GroupMember;

// ==========================================
// Group Models
// ==========================================
export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  currency: string; // e.g. 'INR'
  googleSheetSync?: boolean; // App/Group level toggle to enable or disable Google Sheets sync
  createdAt: string;
}

export type Flat = Group;

// ==========================================
// Expense & Splitting Models
// ==========================================
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export type ExpenseCategory =
  | 'Groceries'
  | 'Rent'
  | 'Electricity'
  | 'Wi-Fi'
  | 'Maid & Cook'
  | 'Drinking Water'
  | 'Household'
  | 'Food & Dining'
  | 'Other';

export interface ExpenseSplit {
  userEmail: string;
  amountMinorUnits: number; // In paise/cents (e.g., 3333 for ₹33.33)
  amountDisplay: number; // In standard currency unit (e.g., 33.33)
  percentage?: number;
}

export interface Expense {
  id: string;
  groupId: string;
  flatId?: string; // Backwards-compatible alias
  payerEmail: string;
  title: string;
  date: string; // Mandatory expense date (YYYY-MM-DD)
  totalAmountMinorUnits: number; // Stored in paise/cents
  totalAmountDisplay: number; // Stored in standard unit (e.g., 100.00)
  category: ExpenseCategory;
  splitType: SplitType;
  splits: Record<string, number>; // { [userEmail]: amountMinorUnits }
  utrNumber?: string;
  overwrittenFlag: 'YES' | 'NO';
  originalExpenseId?: string;
  duplicateOfId?: string;
  sheetRowIndex?: number;
  sheetRowLink?: string;
  historyLog?: string; // JSON diff string
  sheetSyncStatus: 'SYNCED' | 'PENDING' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Deduplication & Conflict Models
// ==========================================
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

// ==========================================
// Settlement & Debt Models
// ==========================================
export interface Settlement {
  id: string;
  groupId: string;
  flatId?: string; // Backwards-compatible alias
  payerEmail: string;
  receiverEmail: string;
  amountMinorUnits: number;
  amountDisplay: number;
  notes?: string;
  settledAt: string;
}

export interface SimplifiedDebtTransaction {
  fromUserEmail: string; // Debtor (must pay)
  toUserEmail: string; // Creditor (gets money)
  amountMinorUnits: number;
  amountDisplay: number;
  receiverUPI?: string;
  receiverName?: string;
  upiLink?: string;
}

export interface GroupBalanceSheet {
  groupId: string;
  flatId?: string; // Backwards-compatible alias
  netBalances: Record<string, number>; // { [userEmail]: netMinorUnits } (+ve = receives, -ve = owes)
  simplifiedDebts: SimplifiedDebtTransaction[];
}

export type FlatBalanceSheet = GroupBalanceSheet;

// ==========================================
// Statement Models
// ==========================================
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
  groupId: string;
  groupName: string;
  flatId?: string; // Backwards-compatible alias
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

// ==========================================
// Receipt OCR Extraction Models
// ==========================================
export interface ExtractedReceiptResult {
  amountDisplay: number;
  amountMinorUnits: number;
  merchant: string;
  category: ExpenseCategory;
  utrNumber?: string;
  rawText?: string;
  extractedAt: string;
}
