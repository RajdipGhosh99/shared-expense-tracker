import {
  Group,
  GroupMember,
  GroupFormControls,
  Flat,
  FlatMember,
  Expense,
  Settlement,
  MonthlyStatement,
  GroupInvite,
  GroupInviteStatus,
  EligibleMember,
  SpaceInvite,
  SpaceInviteStatus,
  InviteOtp,
} from '@shared-expense-tracker/shared';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  upiId?: string;
  createdAt?: string;
}

export interface IDataStore {
  init(): Promise<void>;

  // Users & Auth
  createUser(user: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    upiId?: string;
  }): Promise<UserRecord>;
  getUserByEmail(email: string): Promise<UserRecord | null>;
  deleteUserByEmail(email: string): Promise<boolean>;

  // User Auth Email OTPs
  saveUserOtp(record: { id: string; email: string; otpHash: string; attemptsLeft: number; expiresAt: string; createdAt: string }): Promise<void>;
  getActiveUserOtp(email: string): Promise<{ id: string; email: string; otpHash: string; attemptsLeft: number; expiresAt: string } | null>;
  decrementUserOtpAttempts(otpId: string): Promise<number>;
  deleteUserOtps(email: string): Promise<boolean>;

  // Groups (Primary API)
  createGroup(group: Group): Promise<Group>;
  getGroupById(groupId: string): Promise<Group | null>;
  getGroupByInviteCode(code: string): Promise<Group | null>;
  getAllGroups(): Promise<Group[]>;
  updateGroupStatus(groupId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<boolean>;
  deleteGroup(groupId: string): Promise<boolean>;
  updateGroupFormControls(groupId: string, formControls: GroupFormControls): Promise<boolean>;

  // Flats (Backwards compatibility)
  createFlat(flat: Flat): Promise<Flat>;
  getFlatById(flatId: string): Promise<Flat | null>;
  getFlatByInviteCode(code: string): Promise<Flat | null>;
  getAllFlats(): Promise<Flat[]>;

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
  updateMemberTenancy(
    groupId: string,
    userEmail: string,
    movedInAt: string,
    movedOutAt?: string | null,
  ): Promise<boolean>;
  getEligibleMembers(groupId: string, date: string): Promise<EligibleMember[]>;

  // Tenancy & Group Invites (Legacy)
  createGroupInvite(invite: GroupInvite): Promise<GroupInvite>;
  getGroupInviteByCode(inviteCode: string): Promise<GroupInvite | null>;
  getGroupInvitesByGroup(groupId: string): Promise<GroupInvite[]>;
  getPendingInviteByEmail(groupId: string, email: string): Promise<GroupInvite | null>;
  updateGroupInviteStatus(inviteId: string, status: GroupInviteStatus): Promise<boolean>;

  // Modern Persistent Space Invites & OTPs
  createSpaceInvite(invite: SpaceInvite): Promise<SpaceInvite>;
  getSpaceInviteByTokenHash(tokenHash: string): Promise<SpaceInvite | null>;
  getSpaceInvitesBySpace(spaceId: string): Promise<SpaceInvite[]>;
  updateSpaceInviteStatus(inviteId: string, status: SpaceInviteStatus, acceptedAt?: string): Promise<boolean>;
  updateSpaceInviteLastOtpSent(inviteId: string, sentAt: string): Promise<boolean>;
  revokeSpaceInvitesForMember(spaceId: string, email: string): Promise<boolean>;

  // Invite OTP Management
  saveInviteOtp(otpRecord: InviteOtp): Promise<InviteOtp>;
  getActiveInviteOtp(inviteId: string): Promise<InviteOtp | null>;
  decrementOtpAttempts(otpId: string): Promise<number>;
  deleteInviteOtps(inviteId: string): Promise<boolean>;

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
