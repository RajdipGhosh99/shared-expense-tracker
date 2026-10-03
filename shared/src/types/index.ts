// ==========================================
// User & Member Models
// ==========================================
export type MemberRole = 'ADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'PENDING' | 'REJECTED';

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
  status?: MemberStatus; // 'ACTIVE' | 'PENDING' | 'REJECTED'
  isAway?: boolean; // Vacation / Absence mode
  awayUntil?: string;
  joinedAt: string;
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
  | 'Shopping & E-Commerce'
  | 'Entertainment & Leisure'
  | 'Health & Well-being'
  | 'Education & Career'
  | 'Transfers & Settlements'
  | 'Other';

export const CATEGORY_TAXONOMY: Record<ExpenseCategory, string[]> = {
  'Food & Dining': [
    'Groceries & Dark Stores',
    'Delivery & Takeaway',
    'Cafes & Restaurants',
    'Alcohol & Nightlife',
  ],
  'Bills & Utilities': [
    'Power & Grid',
    'Water & Gas',
    'Fiber & Telecom',
    'Society Maintenance & Domestic Help',
    'Rent & Housing',
  ],
  'Transit & Travel': [
    'Daily Commute (Metro, Cab, Auto)',
    'Fuel & Fastag',
    'Flights, Trains & Intercity',
    'Stays & Lodging',
  ],
  'Shopping & E-Commerce': [
    'Fashion & Apparel',
    'Electronics & Tech',
    'Home Decor & Appliances',
    'Quick Retail & Courier',
  ],
  'Entertainment & Leisure': [
    'Digital OTT & Cloud Subscriptions',
    'Movies, Concerts & Live Events',
    'Gaming & Hobbies',
    'Sports & Fitness (Gym/Turf)',
  ],
  'Health & Well-being': [
    'Pharmacy & Diagnostics',
    'Consultations & Hospital',
    'Personal Grooming & Salon',
  ],
  'Education & Career': [
    'Courses, Certifications & Books',
    'Professional Tools & Subscriptions',
    'Conferences & Upskilling',
  ],
  'Transfers & Settlements': [
    'P2P Split Settlement (UPI/Cash)',
    'Credit Card Bill Repayment',
    'Self Account Transfer',
    'Investments (SIP/Stocks/Gold)',
  ],
  Other: ['General & Miscellaneous'],
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
  totalAmountMinorUnits: number; // Stored in paise/cents
  totalAmountDisplay: number; // Stored in standard unit (e.g., 100.00)
  category: ExpenseCategory;
  subCategory?: string; // Subcategory mapped within the primary category
  notes?: string; // Optional or mandatory custom note
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
  utrNumber?: string;
  rawText?: string;
  extractedAt: string;
}
