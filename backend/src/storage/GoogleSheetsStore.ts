import { google } from 'googleapis';
import {
  Group,
  GroupMember,
  Flat,
  FlatMember,
  Expense,
  Settlement,
  MonthlyStatement,
} from '@shared-expense-tracker/shared';
import { IDataStore, UserRecord } from './IDataStore.js';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
}

export class GoogleSheetsStore implements IDataStore {
  private sheets: any = null;
  private spreadsheetId: string;
  private isConfigured: boolean = false;
  private memoryUsers: Map<string, UserRecord> = new Map();

  // --- Users & Auth ---
  async createUser(user: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    upiId?: string;
  }): Promise<UserRecord> {
    const cleanEmail = user.email.toLowerCase().trim();
    const record: UserRecord = {
      id: user.id,
      email: cleanEmail,
      passwordHash: user.passwordHash,
      name: user.name,
      upiId: user.upiId,
      createdAt: new Date().toISOString(),
    };
    this.memoryUsers.set(cleanEmail, record);
    return record;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    return this.memoryUsers.get(email.toLowerCase().trim()) || null;
  }

  async deleteUserByEmail(email: string): Promise<boolean> {
    return this.memoryUsers.delete(email.toLowerCase().trim());
  }

  constructor(config: Partial<GoogleSheetsConfig>) {
    this.spreadsheetId = config.spreadsheetId || '';

    if (config.spreadsheetId && config.clientEmail && config.privateKey) {
      try {
        const auth = new google.auth.JWT({
          email: config.clientEmail,
          key: config.privateKey.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        (auth as any).retryConfig = { retry: 0, noResponseRetries: 0 };
        this.sheets = google.sheets({
          version: 'v4',
          auth,
          retryConfig: { retry: 0, noResponseRetries: 0 },
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('[GoogleSheetsStore] Failed to initialize Google Auth:', err);
      }
    } else {
      console.log('[GoogleSheetsStore] Running in unconfigured/mock mode (Missing credentials).');
    }
  }

  async init(): Promise<void> {
    if (!this.isConfigured) return;

    try {
      const res = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingTabs = (res.data.sheets || []).map((s: any) => s.properties.title);
      const requiredTabs = ['Flats', 'Flat_Members', 'Expenses', 'Settlements', 'Monthly_Archives'];
      const requests: any[] = [];

      for (const tab of requiredTabs) {
        if (!existingTabs.includes(tab)) {
          requests.push({
            addSheet: { properties: { title: tab } },
          });
        }
      }

      if (requests.length > 0) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: { requests },
        });
      }

      // Add Headers to tabs if missing
      await this.initializeHeaders();
    } catch (err) {
      console.warn('[GoogleSheetsStore] Could not auto-initialize sheet tabs:', err);
    }
  }

  private async initializeHeaders() {
    const headers = {
      'Expenses!A1:L1': [
        [
          'ID',
          'Flat ID',
          'Payer Email',
          'Title',
          'Amount (₹)',
          'Category',
          'Split Type',
          'Splits JSON',
          'UTR / Ref',
          'Overwritten?',
          'Linked ID',
          'Created At',
        ],
      ],
      'Settlements!A1:G1': [
        ['ID', 'Flat ID', 'Payer Email', 'Receiver Email', 'Amount (₹)', 'Notes', 'Settled At'],
      ],
      'Flat_Members!A1:G1': [
        ['ID', 'Flat ID', 'User Email', 'Name', 'UPI ID', 'Role', 'Joined At'],
      ],
      'Flats!A1:E1': [['ID', 'Name', 'Invite Code', 'Currency', 'Created At']],
    };

    for (const [range, values] of Object.entries(headers)) {
      try {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
      } catch (err) {
        // Ignored if already populated
      }
    }
  }

  // --- Groups (Primary) ---
  async createGroup(group: Group): Promise<Group> {
    return this.createFlat(group);
  }

  async getGroupById(groupId: string): Promise<Group | null> {
    return this.getFlatById(groupId);
  }

  async getGroupByInviteCode(code: string): Promise<Group | null> {
    return this.getFlatByInviteCode(code);
  }

  async getAllGroups(): Promise<Group[]> {
    return this.getAllFlats();
  }

  async updateGroupSync(groupId: string, googleSheetSync: boolean): Promise<boolean> {
    return this.updateFlatSync(groupId, googleSheetSync);
  }

  async updateGroupFormControls(groupId: string, formControls: any): Promise<boolean> {
    return true;
  }

  // --- Flats (Backward Compatibility) ---
  async createFlat(flat: Flat): Promise<Flat> {
    if (!this.isConfigured) return flat;
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Flats!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[flat.id, flat.name, flat.inviteCode, flat.currency, flat.createdAt]],
      },
    });
    return flat;
  }

  async getFlatById(flatId: string): Promise<Flat | null> {
    const flats = await this.getAllFlats();
    return flats.find((f) => f.id === flatId) || null;
  }

  async getFlatByInviteCode(code: string): Promise<Flat | null> {
    const flats = await this.getAllFlats();
    return flats.find((f) => f.inviteCode.toUpperCase() === code.trim().toUpperCase()) || null;
  }

  async getAllFlats(): Promise<Flat[]> {
    if (!this.isConfigured) return [];
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Flats!A2:E',
    });
    const rows = res.data.values || [];
    return rows.map((r: any[]) => ({
      id: r[0],
      name: r[1],
      inviteCode: r[2],
      currency: r[3] || 'INR',
      googleSheetSync: true,
      createdAt: r[4] || new Date().toISOString(),
    }));
  }

  async updateFlatSync(flatId: string, googleSheetSync: boolean): Promise<boolean> {
    return true;
  }

  // --- Members ---
  async addMember(member: FlatMember): Promise<FlatMember> {
    if (!this.isConfigured) return member;
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Flat_Members!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            member.id,
            member.flatId,
            member.userEmail,
            member.name,
            member.upiId || '',
            member.role,
            member.joinedAt,
          ],
        ],
      },
    });
    return member;
  }

  async getMembers(flatId: string): Promise<FlatMember[]> {
    if (!this.isConfigured) return [];
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Flat_Members!A2:G',
    });
    const rows = res.data.values || [];
    return rows
      .filter((r: any[]) => r[1] === flatId)
      .map((r: any[]) => ({
        id: r[0],
        flatId: r[1],
        userEmail: r[2],
        name: r[3],
        upiId: r[4] || undefined,
        role: r[5] || 'MEMBER',
        joinedAt: r[6] || new Date().toISOString(),
      }));
  }

  async getMember(flatId: string, userEmail: string): Promise<FlatMember | null> {
    const members = await this.getMembers(flatId);
    return members.find((m) => m.userEmail.toLowerCase() === userEmail.toLowerCase()) || null;
  }

  async getUserGroups(userEmail: string): Promise<any[]> {
    return [];
  }

  async updateMemberStatus(groupId: string, userEmail: string, status: string): Promise<boolean> {
    return true;
  }

  async updateMemberRole(groupId: string, userEmail: string, role: string): Promise<boolean> {
    return true;
  }

  async removeMember(groupId: string, userEmail: string): Promise<boolean> {
    return true;
  }

  async updateMemberAway(
    flatId: string,
    userEmail: string,
    isAway: boolean,
    awayUntil?: string,
  ): Promise<boolean> {
    return true; // Maintained primarily in Turso
  }

  // --- Expenses ---
  async createExpense(expense: Expense): Promise<Expense> {
    if (!this.isConfigured) return expense;

    const row = [
      expense.id,
      expense.flatId,
      expense.payerEmail,
      expense.title,
      expense.totalAmountDisplay,
      expense.category,
      expense.splitType,
      JSON.stringify(expense.splits),
      expense.utrNumber || '',
      expense.overwrittenFlag,
      expense.originalExpenseId || expense.duplicateOfId || '',
      expense.createdAt,
    ];

    const appendRes = await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Expenses!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    // Extract row index if available
    const updatedRange = appendRes.data.updates?.updatedRange || '';
    const match = updatedRange.match(/Expenses!A(\d+)/);
    if (match) {
      expense.sheetRowIndex = parseInt(match[1], 10);
      expense.sheetRowLink = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit#gid=0&range=A${match[1]}:L${match[1]}`;
    }

    return expense;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    if (!this.isConfigured) return null;
    // For updates, we can append revision or update row
    return null;
  }

  async getExpenses(flatId: string): Promise<Expense[]> {
    if (!this.isConfigured) return [];
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Expenses!A2:L',
    });
    const rows = res.data.values || [];
    return rows
      .filter((r: any[]) => r[1] === flatId)
      .map((r: any[]) => ({
        id: r[0],
        flatId: r[1],
        payerEmail: r[2],
        title: r[3],
        date: (r[11] || new Date().toISOString()).slice(0, 10),
        totalAmountDisplay: parseFloat(r[4]) || 0,
        totalAmountMinorUnits: Math.round((parseFloat(r[4]) || 0) * 100),
        category: r[5] || 'Other',
        splitType: r[6] || 'EQUAL',
        splits: r[7] ? JSON.parse(r[7]) : {},
        utrNumber: r[8] || undefined,
        overwrittenFlag: r[9] || 'NO',
        originalExpenseId: r[10] || undefined,
        sheetSyncStatus: 'SYNCED',
        createdAt: r[11] || new Date().toISOString(),
        updatedAt: r[11] || new Date().toISOString(),
      }));
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const all = await this.getExpenses('');
    return all.find((e) => e.id === id) || null;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return true;
  }

  // --- Settlements ---
  async createSettlement(settlement: Settlement): Promise<Settlement> {
    if (!this.isConfigured) return settlement;
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Settlements!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            settlement.id,
            settlement.flatId,
            settlement.payerEmail,
            settlement.receiverEmail,
            settlement.amountDisplay,
            settlement.notes || '',
            settlement.settledAt,
          ],
        ],
      },
    });
    return settlement;
  }

  async getSettlements(flatId: string): Promise<Settlement[]> {
    if (!this.isConfigured) return [];
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Settlements!A2:G',
    });
    const rows = res.data.values || [];
    return rows
      .filter((r: any[]) => r[1] === flatId)
      .map((r: any[]) => ({
        id: r[0],
        flatId: r[1],
        payerEmail: r[2],
        receiverEmail: r[3],
        amountDisplay: parseFloat(r[4]) || 0,
        amountMinorUnits: Math.round((parseFloat(r[4]) || 0) * 100),
        notes: r[5] || undefined,
        settledAt: r[6] || new Date().toISOString(),
      }));
  }

  async saveMonthlyStatement(statement: MonthlyStatement): Promise<void> {
    if (!this.isConfigured) return;
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Monthly_Archives!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            statement.flatId,
            statement.periodLabel,
            statement.totalSpendDisplay,
            JSON.stringify(statement.categoryBreakdown),
            statement.createdAt,
          ],
        ],
      },
    });
  }

  async getMonthlyStatements(flatId: string): Promise<MonthlyStatement[]> {
    return [];
  }
}
