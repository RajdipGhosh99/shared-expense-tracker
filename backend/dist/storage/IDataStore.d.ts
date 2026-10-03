import { Group, GroupMember, GroupFormControls, Flat, Expense, Settlement, MonthlyStatement, GroupInvite, GroupInviteStatus, EligibleMember } from '@shared-expense-tracker/shared';
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
    createUser(user: {
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        upiId?: string;
    }): Promise<UserRecord>;
    getUserByEmail(email: string): Promise<UserRecord | null>;
    deleteUserByEmail(email: string): Promise<boolean>;
    createGroup(group: Group): Promise<Group>;
    getGroupById(groupId: string): Promise<Group | null>;
    getGroupByInviteCode(code: string): Promise<Group | null>;
    getAllGroups(): Promise<Group[]>;
    updateGroupSync(groupId: string, googleSheetSync: boolean): Promise<boolean>;
    updateGroupFormControls(groupId: string, formControls: GroupFormControls): Promise<boolean>;
    createFlat(flat: Flat): Promise<Flat>;
    getFlatById(flatId: string): Promise<Flat | null>;
    getFlatByInviteCode(code: string): Promise<Flat | null>;
    getAllFlats(): Promise<Flat[]>;
    updateFlatSync(flatId: string, googleSheetSync: boolean): Promise<boolean>;
    addMember(member: GroupMember): Promise<GroupMember>;
    getMembers(groupId: string): Promise<GroupMember[]>;
    getMember(groupId: string, userEmail: string): Promise<GroupMember | null>;
    getUserGroups(userEmail: string): Promise<any[]>;
    updateMemberStatus(groupId: string, userEmail: string, status: string): Promise<boolean>;
    updateMemberRole(groupId: string, userEmail: string, role: string): Promise<boolean>;
    removeMember(groupId: string, userEmail: string): Promise<boolean>;
    updateMemberAway(groupId: string, userEmail: string, isAway: boolean, awayUntil?: string): Promise<boolean>;
    updateMemberTenancy(groupId: string, userEmail: string, movedInAt: string, movedOutAt?: string | null): Promise<boolean>;
    getEligibleMembers(groupId: string, date: string): Promise<EligibleMember[]>;
    createGroupInvite(invite: GroupInvite): Promise<GroupInvite>;
    getGroupInviteByCode(inviteCode: string): Promise<GroupInvite | null>;
    getGroupInvitesByGroup(groupId: string): Promise<GroupInvite[]>;
    getPendingInviteByEmail(groupId: string, email: string): Promise<GroupInvite | null>;
    updateGroupInviteStatus(inviteId: string, status: GroupInviteStatus): Promise<boolean>;
    createExpense(expense: Expense): Promise<Expense>;
    updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null>;
    getExpenses(groupId: string): Promise<Expense[]>;
    getExpenseById(id: string): Promise<Expense | null>;
    deleteExpense(id: string): Promise<boolean>;
    createSettlement(settlement: Settlement): Promise<Settlement>;
    getSettlements(groupId: string): Promise<Settlement[]>;
    saveMonthlyStatement(statement: MonthlyStatement): Promise<void>;
    getMonthlyStatements(groupId: string): Promise<MonthlyStatement[]>;
}
//# sourceMappingURL=IDataStore.d.ts.map