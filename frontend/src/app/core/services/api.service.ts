import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Group,
  GroupMember,
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
} from '@shared-expense-tracker/shared';

export interface AuthResponse {
  token: string;
  user: { email: string; name: string; upiId?: string; avatar?: string };
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = '/api';

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
    const savedToken = localStorage.getItem('group_jwt') || localStorage.getItem('flat_jwt');
    const savedUser = localStorage.getItem('group_user') || localStorage.getItem('flat_user');
    const savedGroup = localStorage.getItem('group_active') || localStorage.getItem('flat_active');

    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
      this.fetchUserGroups().subscribe();
    }
    if (savedGroup) {
      const parsed = JSON.parse(savedGroup);
      this.activeGroup.set(parsed);
      if (savedToken) {
        this.refreshGroupData(parsed.id);
      }
    }
  }

  // --- Auth ---
  register(data: {
    email: string;
    password: string;
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
    localStorage.setItem('flat_jwt', res.token);
    localStorage.setItem('flat_user', JSON.stringify(res.user));
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
    localStorage.setItem('flat_active', JSON.stringify(group));
    this.activeGroup.set(group);
    this.refreshGroupData(group.id);
  }

  setActiveFlat(flat: Flat) {
    this.setActiveGroup(flat);
  }

  refreshGroupData(groupId: string) {
    this.http
      .get<{ members: GroupMember[] }>(`${this.baseUrl}/groups/${groupId}/members`)
      .subscribe({
        next: (res) => this.members.set(res.members),
      });

    this.http
      .get<{ expenses: Expense[] }>(`${this.baseUrl}/expenses?groupId=${groupId}`)
      .subscribe({
        next: (res) => this.expenses.set(res.expenses),
      });

    this.http
      .get<GroupBalanceSheet>(`${this.baseUrl}/settlements/balances?groupId=${groupId}`)
      .subscribe({
        next: (res) => this.balanceSheet.set(res),
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
          if (!this.activeGroup() && res.memberships && res.memberships.length > 0) {
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
    if (!group) throw new Error('No active group');
    return this.http
      .patch(`${this.baseUrl}/groups/${group.id}/members/away`, { isAway, awayUntil })
      .pipe(tap(() => this.refreshGroupData(group.id)));
  }

  // --- Expenses ---
  addExpense(data: {
    title: string;
    amount: number;
    date?: string;
    category: string;
    splitType: string;
    splits?: Record<string, number>;
    utrNumber?: string;
    allowOverwrite?: boolean;
    overwriteTargetId?: string;
  }): Observable<{ status: string; expense: Expense }> {
    const group = this.activeGroup();
    if (!group) throw new Error('No active group');

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
      date?: string;
      category?: string;
      splitType?: string;
      utrNumber?: string;
    }>,
  ): Observable<{ status: string; count: number; expenses: Expense[]; errors: any[] }> {
    const group = this.activeGroup();
    if (!group) throw new Error('No active group');

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
    if (!group) throw new Error('No active group');

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
    if (!group) throw new Error('No active group');

    let url = `${this.baseUrl}/statements?groupId=${group.id}&period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    return this.http.get<{ statement: MonthlyStatement; whatsappLink: string }>(url);
  }
}
