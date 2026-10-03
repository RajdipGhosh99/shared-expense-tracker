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

  // Members & Roles
  addMember(member: GroupMember): Promise<GroupMember>;
  getMembers(groupId: string): Promise<GroupMember[]>;
  getMember(groupId: string, userEmail: string): Promise<GroupMember | null>;
  getUserGroups(userEmail: string): Promise<any[]>;
  updateMemberStatus(groupId: string, userEmail: string, status: string): Promise<boolean>;
  updateMemberRole(groupId: string, userEmail: string, role: string): Promise<boolean>;
  removeMember(groupId: string, userEmail: string): Promise<boolean>;
  updateMemberAway(
    groupId: string,
    userEmail: string,
    isAway: boolean,
    awayUntil?: string,
  ): Promise<boolean>;

  // Expenses
  createExpense(expense: Expense): Promise<Expense>;
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null>;
  getExpenses(groupId: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | null>;
  deleteExpense(id: string): Promise<boolean>;

  // Settlements
  createSettlement(settlement: Settlement): Promise<Settlement>;
  getSettlements(groupId: string): Promise<Settlement[]>;

  // Monthly Statements
  saveMonthlyStatement(statement: MonthlyStatement): Promise<void>;
  getMonthlyStatements(groupId: string): Promise<MonthlyStatement[]>;
}
