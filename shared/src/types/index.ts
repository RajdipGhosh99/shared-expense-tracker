// ==========================================
// User & Member Models
// ==========================================
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
  flatId?: string; // Backwards-compatible alias
  userEmail: string;
  name: string;
  upiId?: string;
  role: MemberRole;
  status?: MemberStatus; // 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT'
  isAway?: boolean; // Vacation / Absence mode
  awayUntil?: string;
  joinedAt: string;
  movedInAt?: string; // Physical move-in date (YYYY-MM-DD)
  movedOutAt?: string; // Physical move-out date (YYYY-MM-DD, null if still residing)
}

export interface UserGroupMembership {
  group: Group;
  flat: Group;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
}

export type FlatMember = GroupMember;

// ==========================================
// Group Form Control Models (Admin Customization)
// ==========================================
export type FieldControlMode = 'mandatory' | 'editable' | 'view_only' | 'hidden';

export interface GroupFormControls {
  amount: FieldControlMode; // e.g. mandatory
  title: FieldControlMode; // e.g. mandatory
  date: FieldControlMode; // mandatory or editable
  category: FieldControlMode; // mandatory or editable
  subCategory: FieldControlMode; // editable, mandatory, or hidden
  splitType: FieldControlMode; // editable, view_only (fixed Equal), or hidden
  notes: FieldControlMode; // editable, mandatory, or hidden
}

export const DEFAULT_GROUP_FORM_CONTROLS: GroupFormControls = {
  amount: 'mandatory',
  title: 'mandatory',
  date: 'mandatory',
  category: 'mandatory',
  subCategory: 'editable',
  splitType: 'editable',
  notes: 'editable',
};

// ==========================================
// Group Models
// ==========================================
export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  currency: string; // e.g. 'INR'
  googleSheetSync?: boolean; // App/Group level toggle to enable or disable Google Sheets sync
  formControls?: GroupFormControls; // Group-level entry form controls managed by Admin
  createdAt: string;
}

export type Flat = Group;

// ==========================================
// Expense & Splitting Models
// ==========================================
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Bills & Utilities'
  | 'Transit & Travel'
  | 'Shopping & Lifestyle'
  | 'Entertainment & Leisure'
  | 'Health & Wellness'
  | 'Education & Work'
  | 'Transfers & Adjustments'
  | 'Other'
  // Backwards-compatible aliases
  | 'Shopping & E-Commerce'
  | 'Health & Well-being'
  | 'Education & Career'
  | 'Transfers & Settlements';

export const CATEGORY_TAXONOMY: Record<string, string[]> = {
  'Food & Dining': [
    'Groceries & Dark Stores',
    'Food Delivery',
    'Dine-in & Cafes',
    'Nightlife & Social',
  ],
  'Bills & Utilities': [
    'Electricity & Power',
    'Water & Cooking Gas',
    'Internet & Telecom',
    'Rent & Housing',
    'Society & Domestic Help',
  ],
  'Transit & Travel': [
    'Daily Commute',
    'Fuel & Tolls',
    'Outstation & Holidays',
    'Vehicle Maintenance',
  ],
  'Shopping & Lifestyle': [
    'Electronics & Hardware',
    'Apparel & Fashion',
    'Home & Living',
    'Personal Care',
  ],
  'Entertainment & Leisure': ['Digital Subscriptions', 'Movies & Events', 'Sports & Hobbies'],
  'Health & Wellness': ['Medicines & Pharmacy', 'Diagnostics & Doctors', 'Fitness & Gym'],
  'Education & Work': ['Upskilling & Courses', 'Books & Work Tools'],
  'Transfers & Adjustments': ['Split Settlement', 'Credit Card Repayment', 'Investments & Savings'],
  Other: ['Other', 'General & Miscellaneous'],

  // Backwards-compatible aliases
  'Shopping & E-Commerce': [
    'Electronics & Hardware',
    'Apparel & Fashion',
    'Home & Living',
    'Personal Care',
  ],
  'Health & Well-being': ['Medicines & Pharmacy', 'Diagnostics & Doctors', 'Fitness & Gym'],
  'Education & Career': ['Upskilling & Courses', 'Books & Work Tools'],
  'Transfers & Settlements': ['Split Settlement', 'Credit Card Repayment', 'Investments & Savings'],
};

export interface SplitDynamicInfo {
  splitDynamic: string;
  defaultSplitType: SplitType;
  isExpense: boolean;
}

export const CATEGORY_SPLIT_DYNAMIC: Record<string, SplitDynamicInfo> = {
  // Food & Dining
  'Groceries & Dark Stores': {
    splitDynamic: 'Equal split',
    defaultSplitType: 'EQUAL',
    isExpense: true,
  },
  'Food Delivery': { splitDynamic: 'Exact / Itemized', defaultSplitType: 'EXACT', isExpense: true },
  'Dine-in & Cafes': {
    splitDynamic: 'Exact / Itemized',
    defaultSplitType: 'EXACT',
    isExpense: true,
  },
  'Nightlife & Social': {
    splitDynamic: 'Itemized / Custom',
    defaultSplitType: 'EXACT',
    isExpense: true,
  },
  // Bills & Utilities
  'Electricity & Power': {
    splitDynamic: 'Equal split',
    defaultSplitType: 'EQUAL',
    isExpense: true,
  },
  'Water & Cooking Gas': {
    splitDynamic: 'Equal split',
    defaultSplitType: 'EQUAL',
    isExpense: true,
  },
  'Internet & Telecom': { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
  'Rent & Housing': {
    splitDynamic: 'Ratio / Equal split',
    defaultSplitType: 'EQUAL',
    isExpense: true,
  },
  'Society & Domestic Help': {
    splitDynamic: 'Equal split',
    defaultSplitType: 'EQUAL',
    isExpense: true,
  },
  // Transit & Travel
  'Daily Commute': {
    splitDynamic: 'Equal split (shared ride)',
    defaultSplitType: 'EQUAL',
    isExpense: true,
  },
  'Fuel & Tolls': { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
  'Outstation & Holidays': {
    splitDynamic: 'Group pool / Equal',
    defaultSplitType: 'EQUAL',
    isExpense: true,
  },
  'Vehicle Maintenance': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
  // Shopping & Lifestyle
  'Electronics & Hardware': {
    splitDynamic: 'Personal',
    defaultSplitType: 'EQUAL',
    isExpense: true,
  },
  'Apparel & Fashion': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
  'Home & Living': { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
  'Personal Care': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
  // Entertainment & Leisure
  'Digital Subscriptions': {
    splitDynamic: 'Equal split',
    defaultSplitType: 'EQUAL',
    isExpense: true,
  },
  'Movies & Events': {
    splitDynamic: 'Exact / Itemized',
    defaultSplitType: 'EXACT',
    isExpense: true,
  },
  'Sports & Hobbies': { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
  // Health & Wellness
  'Medicines & Pharmacy': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
  'Diagnostics & Doctors': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
  'Fitness & Gym': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
  // Education & Work
  'Upskilling & Courses': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
  'Books & Work Tools': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
  // Transfers & Adjustments (CRITICAL: isExpense: false)
  'Split Settlement': {
    splitDynamic: 'System transfer',
    defaultSplitType: 'EQUAL',
    isExpense: false,
  },
  'Credit Card Repayment': {
    splitDynamic: 'System transfer',
    defaultSplitType: 'EQUAL',
    isExpense: false,
  },
  'Investments & Savings': {
    splitDynamic: 'System transfer',
    defaultSplitType: 'EQUAL',
    isExpense: false,
  },
  // Fallback
  Other: { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
};

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
  expenseDate?: string; // Effective receipt date (YYYY-MM-DD)
  billingPeriodStart?: string; // Optional start of billing period (YYYY-MM-DD)
  billingPeriodEnd?: string; // Optional end of billing period (YYYY-MM-DD)
  totalAmountMinorUnits: number; // Stored in paise/cents
  totalAmountDisplay: number; // Stored in standard unit (e.g., 100.00)
  category: ExpenseCategory;
  subCategory?: string; // Subcategory mapped within the primary category
  notes?: string; // Optional or mandatory custom note
  isExpense?: boolean; // Flagged false for Transfers & Adjustments (debt settlements, credit card payoffs)
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
// Tenancy & Group Invites Models
// ==========================================
export type GroupInviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export type SpaceInviteStatus = 'PENDING_ACCEPTANCE' | 'ACTIVE' | 'REVOKED';

export interface SpaceInvite {
  id: string;
  spaceId: string;
  tokenHash: string;
  invitedEmail: string;
  suggestedName?: string;
  createdBy: string;
  status: SpaceInviteStatus;
  createdAt: string;
  acceptedAt?: string;
  lastOtpSentAt?: string;
}

export interface InviteOtp {
  id: string;
  inviteId: string;
  otpHash: string;
  attemptsLeft: number;
  expiresAt: string;
  createdAt: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  inviteCode: string;
  inviteeName: string;
  inviteeEmail: string;
  effectiveMoveInDate: string; // YYYY-MM-DD
  createdBy: string;
  status: GroupInviteStatus;
  expiresAt: string; // ISO datetime
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
export interface StatementSubcategorySummary {
  subCategory: string;
  amountDisplay: number;
  percentage: number; // Percentage of the parent category spend
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
  subCategory?: string;
  utrNumber?: string;
  rawText?: string;
  extractedAt: string;
}
