import {
  Group,
  GroupMember,
  Flat,
  FlatMember,
  Expense,
  Settlement,
  MonthlyStatement,
} from '@shared-expense-tracker/shared';

export interface IDataStore {
  init(): Promise<void>;

  // Groups (Primary API)
  createGroup(group: Group): Promise<Group>;
  getGroupById(groupId: string): Promise<Group | null>;
  getGroupByInviteCode(code: string): Promise<Group | null>;
  getAllGroups(): Promise<Group[]>;
  updateGroupSync(groupId: string, googleSheetSync: boolean): Promise<boolean>;

  // Flats (Backwards compatibility)
  createFlat(flat: Flat): Promise<Flat>;
  getFlatById(flatId: string): Promise<Flat | null>;
  getFlatByInviteCode(code: string): Promise<Flat | null>;
  getAllFlats(): Promise<Flat[]>;
  updateFlatSync(flatId: string, googleSheetSync: boolean): Promise<boolean>;

  // Members
  addMember(member: FlatMember): Promise<FlatMember>;
  getMembers(flatId: string): Promise<FlatMember[]>;
  getMember(flatId: string, userEmail: string): Promise<FlatMember | null>;
  updateMemberAway(
    flatId: string,
    userEmail: string,
    isAway: boolean,
    awayUntil?: string
  ): Promise<boolean>;

  // Expenses
  createExpense(expense: Expense): Promise<Expense>;
  updateExpense(
    id: string,
    updates: Partial<Expense>
  ): Promise<Expense | null>;
  getExpenses(flatId: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | null>;
  deleteExpense(id: string): Promise<boolean>;

  // Settlements
  createSettlement(settlement: Settlement): Promise<Settlement>;
  getSettlements(flatId: string): Promise<Settlement[]>;

  // Monthly Statements
  saveMonthlyStatement(statement: MonthlyStatement): Promise<void>;
  getMonthlyStatements(flatId: string): Promise<MonthlyStatement[]>;
}
