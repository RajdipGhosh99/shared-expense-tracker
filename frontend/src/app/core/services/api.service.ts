import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, tap, EMPTY, throwError } from 'rxjs';
import {
  Group,
  GroupMember,
  GroupFormControls,
  MemberRole,
  MemberStatus,
  UserGroupMembership,
  GroupBalanceSheet,
  Flat,
  FlatMember,
  Expense,
  ExpenseCategory,
  Settlement,
  FlatBalanceSheet,
  MonthlyStatement,
  ExtractedReceiptResult,
  DuplicateConflictResponse,
  EligibleMember,
  GroupInvite,
} from '@shared-expense-tracker/shared';

export interface AuthResponse {
  token: string;
  user: { email: string; name: string; upiId?: string; avatar?: string };
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl =
    (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) || '/api';

  // Reactive State Signals
  currentUser = signal<{ email: string; name: string; upiId?: string; avatar?: string } | null>(
    null,
  );
  token = signal<string | null>(null);
  activeGroup = signal<Group | null>(null);
  activeFlat = this.activeGroup; // Backward compatibility alias
  userGroups = signal<UserGroupMembership[]>([]);
  members = signal<GroupMember[]>([]);
  expenses = signal<Expense[]>([]);
  balanceSheet = signal<GroupBalanceSheet | null>(null);

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession() {
    const savedToken = localStorage.getItem('group_jwt');
    const savedUser = localStorage.getItem('group_user');
    const savedGroup = localStorage.getItem('group_active');

    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
      // Verify account is still valid in database (e.g. after DB wipe or token expiration)
      this.checkMe().subscribe({
        next: (me) => {
          if (me?.user) {
            this.currentUser.set(me.user);
          }
          this.fetchUserGroups().subscribe();
        },
        error: (err) => {
          if (err?.status === 401) {
            this.logout();
          }
        },
      });
    }
    if (savedGroup) {
      const parsed = JSON.parse(savedGroup);
      this.activeGroup.set(parsed);
      if (savedToken) {
        this.refreshGroupData(parsed.id);
      }
    }
  }

  checkMe(): Observable<{ user: { email: string; name: string; upiId?: string } }> {
    return this.http.get<{ user: { email: string; name: string; upiId?: string } }>(
      `${this.baseUrl}/auth/me`,
    );
  }

  // --- Passwordless Auth via Email OTP ---
  sendAuthOtp(email: string, name?: string, mode?: 'login' | 'signup'): Observable<{
    success: boolean;
    message: string;
    isExistingUser: boolean;
    cooldownSeconds: number;
  }> {
    return this.http.post<any>(`${this.baseUrl}/auth/send-otp`, { email, name, mode });
  }

  verifyAuthOtp(data: {
    email: string;
    otp: string;
    name?: string;
    upiId?: string;
    mode?: 'login' | 'signup';
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/verify-otp`, data)
      .pipe(tap((res) => this.setSession(res)));
  }

  register(data: {
    email: string;
    password?: string;
    name: string;
    upiId?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, data)
      .pipe(tap((res) => this.setSession(res)));
  }

  login(data: { email: string; password?: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, data)
      .pipe(tap((res) => this.setSession(res)));
  }

  loginWithGoogle(data: {
    email: string;
    name?: string;
    avatar?: string;
    upiId?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/google`, data)
      .pipe(tap((res) => this.setSession(res)));
  }

  logout() {
    localStorage.clear();
    this.token.set(null);
    this.currentUser.set(null);
    this.activeGroup.set(null);
    this.userGroups.set([]);
    this.members.set([]);
    this.expenses.set([]);
    this.balanceSheet.set(null);
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem('group_jwt', res.token);
    localStorage.setItem('group_user', JSON.stringify(res.user));
    this.token.set(res.token);
    this.currentUser.set(res.user);
  }

  // --- Groups (Primary API) ---
  getGroupById(groupId: string): Observable<{ group: Group; flat: Group; members: GroupMember[] }> {
    return this.http.get<{ group: Group; flat: Group; members: GroupMember[] }>(
      `${this.baseUrl}/groups/${groupId}`,
    );
  }

  getFlatById(flatId: string): Observable<{ group: Group; flat: Group; members: GroupMember[] }> {
    return this.getGroupById(flatId);
  }

  createGroup(
    name: string,
    currency: string = 'INR',
  ): Observable<{ group: Group; flat: Group; member: GroupMember }> {
    return this.http
      .post<{ group: Group; flat: Group; member: GroupMember }>(`${this.baseUrl}/groups`, {
        name,
        currency,
      })
      .pipe(
        tap((res) => {
          this.setActiveGroup(res.group);
          this.fetchUserGroups().subscribe();
        }),
      );
  }

  createFlat(
    name: string,
    currency: string = 'INR',
  ): Observable<{ flat: Flat; member: FlatMember }> {
    return this.createGroup(name, currency);
  }

  joinGroup(inviteCode: string): Observable<{ group: Group; flat: Group; member: GroupMember }> {
    return this.http
      .post<{ group: Group; flat: Group; member: GroupMember }>(`${this.baseUrl}/groups/join`, {
        inviteCode,
      })
      .pipe(
        tap((res) => {
          this.setActiveGroup(res.group);
          this.fetchUserGroups().subscribe();
        }),
      );
  }

  joinFlat(inviteCode: string): Observable<{ flat: Flat; member: FlatMember }> {
    return this.joinGroup(inviteCode);
  }

  setActiveGroup(group: Group) {
    localStorage.setItem('group_active', JSON.stringify(group));
    this.activeGroup.set(group);
    this.refreshGroupData(group.id);
  }

  setActiveFlat(flat: Flat) {
    this.setActiveGroup(flat);
  }

  refreshGroupData(groupId: string, onComplete?: () => void) {
    let pendingRequests = 3;
    const completeRequest = () => {
      pendingRequests -= 1;
      if (pendingRequests === 0) onComplete?.();
    };

    this.http
      .get<{ members: GroupMember[] }>(`${this.baseUrl}/groups/${groupId}/members`)
      .pipe(finalize(completeRequest))
      .subscribe({
        next: (res) => this.members.set(res.members),
        error: (err) => {
          if (err.status === 404) {
            localStorage.removeItem('group_active');
            this.activeGroup.set(null);
            this.members.set([]);
          }
        },
      });

    this.http
      .get<{ expenses: Expense[] }>(`${this.baseUrl}/expenses?groupId=${groupId}`)
      .pipe(finalize(completeRequest))
      .subscribe({
        next: (res) => this.expenses.set(res.expenses),
        error: (err) => {
          if (err.status === 404) this.expenses.set([]);
        },
      });

    this.http
      .get<GroupBalanceSheet>(`${this.baseUrl}/settlements/balances?groupId=${groupId}`)
      .pipe(finalize(completeRequest))
      .subscribe({
        next: (res) => this.balanceSheet.set(res),
        error: (err) => {
          if (err.status === 404) this.balanceSheet.set(null);
        },
      });
  }

  refreshFlatData(flatId: string) {
    this.refreshGroupData(flatId);
  }

  fetchUserGroups(): Observable<{ memberships: UserGroupMembership[]; groups: Group[] }> {
    return this.http
      .get<{ memberships: UserGroupMembership[]; groups: Group[] }>(`${this.baseUrl}/groups`)
      .pipe(
        tap((res) => {
          this.userGroups.set(res.memberships || []);
          if (!res.memberships || res.memberships.length === 0) {
            localStorage.removeItem('group_active');
            this.activeGroup.set(null);
            this.members.set([]);
            this.expenses.set([]);
            this.balanceSheet.set(null);
          } else if (!this.activeGroup()) {
            const active = res.memberships.find((m) => m.status === 'ACTIVE') || res.memberships[0];
            this.setActiveGroup(active.group);
          }
        }),
      );
  }

  approveMember(groupId: string, userEmail: string): Observable<any> {
    return this.http
      .post(
        `${this.baseUrl}/groups/${groupId}/members/${encodeURIComponent(userEmail)}/approve`,
        {},
      )
      .pipe(
        tap(() => {
          this.refreshGroupData(groupId);
          this.fetchUserGroups().subscribe();
        }),
      );
  }

  rejectMember(groupId: string, userEmail: string): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/groups/${groupId}/members/${encodeURIComponent(userEmail)}/reject`, {})
      .pipe(
        tap(() => {
          this.refreshGroupData(groupId);
          this.fetchUserGroups().subscribe();
        }),
      );
  }

  updateGroupStatus(groupId: string, status: 'ACTIVE' | 'INACTIVE'): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/groups/${groupId}/status`, { status })
      .pipe(
        tap((res: any) => {
          if (this.activeGroup()?.id === groupId && res.group) {
            this.setActiveGroup(res.group);
          }
          this.fetchUserGroups().subscribe();
        }),
      );
  }

  deleteGroup(groupId: string, confirmName: string): Observable<any> {
    return this.http
      .request('delete', `${this.baseUrl}/groups/${groupId}`, {
        body: { confirmName },
      })
      .pipe(
        tap(() => {
          if (this.activeGroup()?.id === groupId) {
            localStorage.removeItem('group_active');
            this.activeGroup.set(null);
          }
          this.fetchUserGroups().subscribe();
        }),
      );
  }

  updateMemberStatus(groupId: string, userEmail: string, status: 'ACTIVE' | 'INACTIVE'): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/groups/${groupId}/members/${encodeURIComponent(userEmail)}/status`, {
        status,
      })
      .pipe(
        tap(() => {
          this.refreshGroupData(groupId);
          this.fetchUserGroups().subscribe();
        }),
      );
  }

  updateMemberRole(groupId: string, userEmail: string, role: MemberRole): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/groups/${groupId}/members/${encodeURIComponent(userEmail)}/role`, {
        role,
      })
      .pipe(
        tap(() => {
          this.refreshGroupData(groupId);
          this.fetchUserGroups().subscribe();
        }),
      );
  }

  categorizeWithAi(
    title: string,
  ): Observable<{ category: ExpenseCategory; confidence: number; source: string }> {
    return this.http.post<{ category: ExpenseCategory; confidence: number; source: string }>(
      `${this.baseUrl}/expenses/ai-categorize`,
      { title },
    );
  }

  toggleAway(isAway: boolean, awayUntil?: string): Observable<any> {
    const group = this.activeGroup();
    if (!group) return EMPTY;
    return this.http
      .patch(`${this.baseUrl}/groups/${group.id}/members/away`, { isAway, awayUntil })
      .pipe(tap(() => this.refreshGroupData(group.id)));
  }

  updateGroupFormControls(groupId: string, formControls: GroupFormControls): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/groups/${groupId}/form-controls`, { formControls })
      .pipe(
        tap((res: any) => {
          if (this.activeGroup()?.id === groupId && res.formControls) {
            const current = this.activeGroup()!;
            this.setActiveGroup({ ...current, formControls: res.formControls });
          }
          this.refreshGroupData(groupId);
        }),
      );
  }

  // --- Tenancy & Dynamic Member Eligibility ---
  getEligibleMembers(
    groupId: string,
    date: string,
  ): Observable<{ eligibleMembers: EligibleMember[]; date: string; totalEligible: number }> {
    return this.http.get<{
      eligibleMembers: EligibleMember[];
      date: string;
      totalEligible: number;
    }>(`${this.baseUrl}/groups/${groupId}/eligible-members?date=${encodeURIComponent(date)}`);
  }

  updateMemberTenancy(
    groupId: string,
    userEmail: string,
    data: { moved_in_at?: string; moved_out_at?: string | null },
  ): Observable<{ success: boolean; member: GroupMember; message: string }> {
    return this.http
      .patch<{ success: boolean; member: GroupMember; message: string }>(
        `${this.baseUrl}/groups/${groupId}/members/${encodeURIComponent(userEmail)}/tenancy`,
        data,
      )
      .pipe(
        tap(() => {
          this.refreshGroupData(groupId);
        }),
      );
  }

  createGroupInvite(
    groupId: string,
    data: { invitee_name: string; invitee_email: string; effective_move_in_date: string },
  ): Observable<{ invite: GroupInvite; joinLink: string; inviteCode: string }> {
    return this.http.post<{ invite: GroupInvite; joinLink: string; inviteCode: string }>(
      `${this.baseUrl}/groups/${groupId}/invites`,
      data,
    );
  }

  getGroupInvites(groupId: string): Observable<{ invites: GroupInvite[] }> {
    return this.http.get<{ invites: GroupInvite[] }>(`${this.baseUrl}/groups/${groupId}/invites`);
  }

  revokeGroupInvite(groupId: string, inviteId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/groups/${groupId}/invites/${inviteId}`,
    );
  }

  // --- Expenses ---
  addExpense(data: {
    title: string;
    amount: number;
    payerEmail?: string;
    date?: string;
    category: string;
    subCategory?: string;
    notes?: string;
    isExpense?: boolean;
    splitType: string;
    splits?: Record<string, number>;
    utrNumber?: string;
    allowOverwrite?: boolean;
    overwriteTargetId?: string;
  }): Observable<{ status: string; expense: Expense }> {
    const group = this.activeGroup();
    if (!group) return throwError(() => new Error('No active group'));

    return this.http
      .post<{ status: string; expense: Expense }>(`${this.baseUrl}/expenses`, {
        ...data,
        groupId: group.id,
        flatId: group.id,
      })
      .pipe(tap(() => this.refreshGroupData(group.id)));
  }

  addExpensesBatch(
    items: Array<{
      title: string;
      amount: number;
      payerEmail?: string;
      date?: string;
      category?: string;
      subCategory?: string;
      notes?: string;
      isExpense?: boolean;
      splitType?: string;
      utrNumber?: string;
    }>,
  ): Observable<{ status: string; count: number; expenses: Expense[]; errors: any[] }> {
    const group = this.activeGroup();
    if (!group) return throwError(() => new Error('No active group'));

    return this.http
      .post<{ status: string; count: number; expenses: Expense[]; errors: any[] }>(
        `${this.baseUrl}/expenses/batch`,
        {
          items,
          groupId: group.id,
          flatId: group.id,
        },
      )
      .pipe(tap(() => this.refreshGroupData(group.id)));
  }

  deleteExpense(id: string): Observable<any> {
    const group = this.activeGroup();
    return this.http.delete(`${this.baseUrl}/expenses/${id}`).pipe(
      tap(() => {
        if (group) this.refreshGroupData(group.id);
      }),
    );
  }

  // --- Screenshot Receipt OCR ---
  extractReceipt(file: File): Observable<ExtractedReceiptResult> {
    const formData = new FormData();
    formData.append('receipt', file, file.name);
    return this.http.post<ExtractedReceiptResult>(`${this.baseUrl}/receipts/extract`, formData);
  }

  // --- Settlements ---
  recordSettlement(receiverEmail: string, amount: number, notes?: string): Observable<any> {
    const group = this.activeGroup();
    if (!group) return throwError(() => new Error('No active group'));

    return this.http
      .post(`${this.baseUrl}/settlements`, {
        groupId: group.id,
        flatId: group.id,
        receiverEmail,
        amount,
        notes,
      })
      .pipe(tap(() => this.refreshGroupData(group.id)));
  }

  // --- Statements ---
  getStatement(
    period: 'current' | 'last' | 'custom',
    startDate?: string,
    endDate?: string,
  ): Observable<{
    statement: MonthlyStatement;
    whatsappLink: string;
  }> {
    const group = this.activeGroup();
    if (!group) return throwError(() => new Error('No active group'));

    let url = `${this.baseUrl}/statements?groupId=${group.id}&period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    return this.http.get<{ statement: MonthlyStatement; whatsappLink: string }>(url);
  }

  // --- Modern Space Invites & Passwordless Join Flow ---
  generateSpaceInvite(spaceId: string, email: string, name?: string): Observable<{
    success: boolean;
    inviteId: string;
    inviteUrl: string;
    rawToken: string;
    invitedEmail: string;
    suggestedName?: string;
    spaceName: string;
  }> {
    return this.http.post<any>(`${this.baseUrl}/spaces/${spaceId}/invites`, { email, name });
  }

  validateInvite(token: string): Observable<{
    valid: boolean;
    status: string;
    spaceId: string;
    spaceName: string;
    suggestedName?: string;
    currency: string;
  }> {
    return this.http.get<any>(`${this.baseUrl}/invites/validate?token=${encodeURIComponent(token)}`);
  }

  sendInviteOtp(token: string): Observable<{
    success: boolean;
    message: string;
    cooldownSeconds: number;
    expiresInMinutes: number;
  }> {
    return this.http.post<any>(`${this.baseUrl}/invites/send-otp`, { token });
  }

  acceptInvite(payload: {
    token: string;
    otp: string;
    displayName?: string;
    upiId?: string;
  }): Observable<{
    success: boolean;
    token: string;
    user: { email: string; name: string; upiId?: string; avatar?: string };
    space: { id: string; name: string; currency: string };
    member: GroupMember;
  }> {
    return this.http.post<any>(`${this.baseUrl}/invites/accept`, payload).pipe(
      tap((res) => {
        if (res.token && res.user) {
          localStorage.setItem('group_jwt', res.token);
          localStorage.setItem('group_user', JSON.stringify(res.user));
          this.token.set(res.token);
          this.currentUser.set(res.user);
        }
        if (res.space) {
          this.setActiveGroup(res.space as any);
          this.fetchUserGroups().subscribe();
        }
      }),
    );
  }

  removeMember(groupId: string, userEmail: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(`${this.baseUrl}/groups/${groupId}/members/${encodeURIComponent(userEmail)}`).pipe(
      tap(() => this.refreshGroupData(groupId)),
    );
  }
}
