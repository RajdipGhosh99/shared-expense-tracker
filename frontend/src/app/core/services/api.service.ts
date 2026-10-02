import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Group,
  GroupMember,
  GroupBalanceSheet,
  Flat,
  FlatMember,
  Expense,
  Settlement,
  FlatBalanceSheet,
  MonthlyStatement,
  ExtractedReceiptResult,
  DuplicateConflictResponse,
} from '@shared-expense-tracker/shared';

export interface AuthResponse {
  token: string;
  user: { email: string; name: string; upiId?: string };
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = '/api';

  // Reactive State Signals
  currentUser = signal<{ email: string; name: string; upiId?: string } | null>(null);
  token = signal<string | null>(null);
  activeFlat = signal<Flat | null>(null);
  activeGroup = this.activeFlat;
  members = signal<FlatMember[]>([]);
  expenses = signal<Expense[]>([]);
  balanceSheet = signal<FlatBalanceSheet | null>(null);

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession() {
    const savedToken = localStorage.getItem('flat_jwt');
    const savedUser = localStorage.getItem('flat_user');
    const savedFlat = localStorage.getItem('flat_active');

    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
    }
    if (savedFlat) {
      this.activeFlat.set(JSON.parse(savedFlat));
      if (savedToken) {
        this.refreshFlatData(JSON.parse(savedFlat).id);
      }
    }
  }

  // --- Auth ---
  register(data: { email: string; password: string; name: string; upiId?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, data).pipe(
      tap((res) => this.setSession(res))
    );
  }

  login(data: { email: string; password?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, data).pipe(
      tap((res) => this.setSession(res))
    );
  }

  logout() {
    localStorage.clear();
    this.token.set(null);
    this.currentUser.set(null);
    this.activeFlat.set(null);
    this.members.set([]);
    this.expenses.set([]);
    this.balanceSheet.set(null);
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem('flat_jwt', res.token);
    localStorage.setItem('flat_user', JSON.stringify(res.user));
    this.token.set(res.token);
    this.currentUser.set(res.user);
  }

  // --- Groups (Primary API: getGroupById / createGroup) ---
  getGroupById(groupId: string): Observable<{ group: Group; flat: Group; members: GroupMember[] }> {
    return this.http.get<{ group: Group; flat: Group; members: GroupMember[] }>(`${this.baseUrl}/groups/${groupId}`);
  }

  getFlatById(flatId: string): Observable<{ group: Group; flat: Group; members: GroupMember[] }> {
    return this.getGroupById(flatId);
  }

  createGroup(name: string, currency: string = 'INR'): Observable<{ group: Group; flat: Group; member: GroupMember }> {
    return this.http.post<{ group: Group; flat: Group; member: GroupMember }>(`${this.baseUrl}/groups`, { name, currency }).pipe(
      tap((res) => {
        this.setActiveGroup(res.group);
      })
    );
  }

  createFlat(name: string, currency: string = 'INR'): Observable<{ flat: Flat; member: FlatMember }> {
    return this.createGroup(name, currency);
  }

  joinGroup(inviteCode: string): Observable<{ group: Group; flat: Group; member: GroupMember }> {
    return this.http.post<{ group: Group; flat: Group; member: GroupMember }>(`${this.baseUrl}/groups/join`, { inviteCode }).pipe(
      tap((res) => {
        this.setActiveGroup(res.group);
      })
    );
  }

  joinFlat(inviteCode: string): Observable<{ flat: Flat; member: FlatMember }> {
    return this.joinGroup(inviteCode);
  }

  setActiveGroup(group: Group) {
    this.setActiveFlat(group);
  }

  setActiveFlat(flat: Flat) {
    localStorage.setItem('flat_active', JSON.stringify(flat));
    this.activeFlat.set(flat);
    this.refreshFlatData(flat.id);
  }

  refreshFlatData(flatId: string) {
    this.http.get<{ members: FlatMember[] }>(`${this.baseUrl}/flats/${flatId}/members`).subscribe({
      next: (res) => this.members.set(res.members),
    });

    this.http.get<{ expenses: Expense[] }>(`${this.baseUrl}/expenses?flatId=${flatId}`).subscribe({
      next: (res) => this.expenses.set(res.expenses),
    });

    this.http.get<FlatBalanceSheet>(`${this.baseUrl}/settlements/balances?flatId=${flatId}`).subscribe({
      next: (res) => this.balanceSheet.set(res),
    });
  }

  toggleAway(isAway: boolean, awayUntil?: string): Observable<any> {
    const flat = this.activeFlat();
    if (!flat) throw new Error('No active flat');
    return this.http.patch(`${this.baseUrl}/flats/${flat.id}/members/away`, { isAway, awayUntil }).pipe(
      tap(() => this.refreshFlatData(flat.id))
    );
  }

  toggleGoogleSheetSync(googleSheetSync: boolean): Observable<any> {
    const flat = this.activeFlat();
    if (!flat) throw new Error('No active flat');
    return this.http.patch(`${this.baseUrl}/flats/${flat.id}/sync-settings`, { googleSheetSync }).pipe(
      tap(() => {
        const updated = { ...flat, googleSheetSync };
        this.activeFlat.set(updated);
        localStorage.setItem('flat_active', JSON.stringify(updated));
      })
    );
  }

  // --- Expenses ---
  addExpense(data: {
    title: string;
    amount: number;
    category: string;
    splitType: string;
    splits?: Record<string, number>;
    utrNumber?: string;
    allowOverwrite?: boolean;
    overwriteTargetId?: string;
  }): Observable<{ status: string; expense: Expense }> {
    const flat = this.activeFlat();
    if (!flat) throw new Error('No active flat');

    return this.http.post<{ status: string; expense: Expense }>(`${this.baseUrl}/expenses`, {
      ...data,
      flatId: flat.id,
    }).pipe(
      tap(() => this.refreshFlatData(flat.id))
    );
  }

  deleteExpense(id: string): Observable<any> {
    const flat = this.activeFlat();
    return this.http.delete(`${this.baseUrl}/expenses/${id}`).pipe(
      tap(() => {
        if (flat) this.refreshFlatData(flat.id);
      })
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
    const flat = this.activeFlat();
    if (!flat) throw new Error('No active flat');

    return this.http.post(`${this.baseUrl}/settlements`, {
      flatId: flat.id,
      receiverEmail,
      amount,
      notes,
    }).pipe(
      tap(() => this.refreshFlatData(flat.id))
    );
  }

  // --- Statements ---
  getStatement(period: 'current' | 'last' | 'custom', startDate?: string, endDate?: string): Observable<{
    statement: MonthlyStatement;
    whatsappLink: string;
  }> {
    const flat = this.activeFlat();
    if (!flat) throw new Error('No active flat');

    let url = `${this.baseUrl}/statements?flatId=${flat.id}&period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    return this.http.get<{ statement: MonthlyStatement; whatsappLink: string }>(url);
  }
}
