import {
  Group,
  GroupMember,
  Flat,
  FlatMember,
  Expense,
  Settlement,
  MonthlyStatement,
} from '@shared-expense-tracker/shared';
import { IDataStore } from './IDataStore.js';
import { TursoStore } from './TursoStore.js';
import { GoogleSheetsStore } from './GoogleSheetsStore.js';

export class DualSyncStore implements IDataStore {
  private appLevelGoogleSheetSync: boolean = process.env.GOOGLE_SHEET_SYNC !== 'false';

  constructor(
    private turso: TursoStore,
    private sheets: GoogleSheetsStore
  ) {}

  public isAppGoogleSheetSyncEnabled(): boolean {
    return this.appLevelGoogleSheetSync && process.env.STORAGE_MODE !== 'turso';
  }

  public setAppGoogleSheetSync(enabled: boolean): void {
    this.appLevelGoogleSheetSync = enabled;
  }

  async init(): Promise<void> {
    await this.turso.init();
    if (this.isAppGoogleSheetSyncEnabled()) {
      try {
        await this.sheets.init();
      } catch (err) {
        console.warn('[DualSyncStore] Google Sheets init failed (continuing with Turso):', err);
      }
    }
  }

  // --- Groups (Primary API) ---
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

  // --- Flats (Backward Compatibility) ---
  async createFlat(flat: Flat): Promise<Flat> {
    const saved = await this.turso.createFlat(flat);
    if (this.isAppGoogleSheetSyncEnabled()) {
      // Background mirror to Google Sheets
      this.sheets.createFlat(flat).catch((err) => {
        console.warn('[DualSyncStore] Failed to mirror flat to Google Sheets:', err);
      });
    }
    return saved;
  }

  async getFlatById(flatId: string): Promise<Flat | null> {
    return this.turso.getFlatById(flatId);
  }

  async getFlatByInviteCode(code: string): Promise<Flat | null> {
    return this.turso.getFlatByInviteCode(code);
  }

  async updateFlatSync(flatId: string, googleSheetSync: boolean): Promise<boolean> {
    return this.turso.updateFlatSync(flatId, googleSheetSync);
  }

  async getAllFlats(): Promise<Flat[]> {
    return this.turso.getAllFlats();
  }

  // --- Members ---
  async addMember(member: FlatMember): Promise<FlatMember> {
    const saved = await this.turso.addMember(member);
    if (this.isAppGoogleSheetSyncEnabled()) {
      const flat = await this.turso.getFlatById(member.flatId);
      if (flat?.googleSheetSync !== false) {
        this.sheets.addMember(member).catch((err) => {
          console.warn('[DualSyncStore] Failed to mirror member to Google Sheets:', err);
        });
      }
    }
    return saved;
  }

  async getMembers(flatId: string): Promise<FlatMember[]> {
    return this.turso.getMembers(flatId);
  }

  async getMember(flatId: string, userEmail: string): Promise<FlatMember | null> {
    return this.turso.getMember(flatId, userEmail);
  }

  async updateMemberAway(
    flatId: string,
    userEmail: string,
    isAway: boolean,
    awayUntil?: string
  ): Promise<boolean> {
    return this.turso.updateMemberAway(flatId, userEmail, isAway, awayUntil);
  }

  // --- Expenses ---
  async createExpense(expense: Expense): Promise<Expense> {
    // 1. Primary write to Turso (Fast ACID edge commit)
    const saved = await this.turso.createExpense(expense);

    // 2. Check if App-level or Flat-level Google Sheet Sync is enabled
    if (!this.isAppGoogleSheetSyncEnabled()) {
      await this.turso.updateExpense(saved.id, { sheetSyncStatus: 'SYNCED' });
      return saved;
    }

    const flat = await this.turso.getFlatById(expense.flatId);
    if (flat && flat.googleSheetSync === false) {
      // Sync disabled for this flat!
      await this.turso.updateExpense(saved.id, { sheetSyncStatus: 'SYNCED' });
      return saved;
    }

    // 3. Async mirror to Google Sheets with timeout resilience
    this.sheets
      .createExpense(expense)
      .then(async (sheetExp) => {
        // If sheet returns row index/link, update Turso
        if (sheetExp.sheetRowIndex || sheetExp.sheetRowLink) {
          await this.turso.updateExpense(saved.id, {
            sheetRowIndex: sheetExp.sheetRowIndex,
            sheetRowLink: sheetExp.sheetRowLink,
            sheetSyncStatus: 'SYNCED',
          });
        }
      })
      .catch((err) => {
        console.warn(`[DualSyncStore] Google Sheet sync deferred for expense ${saved.id}:`, err.message);
        this.turso.updateExpense(saved.id, { sheetSyncStatus: 'PENDING' });
      });

    return saved;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const updated = await this.turso.updateExpense(id, updates);
    if (this.isAppGoogleSheetSyncEnabled()) {
      this.sheets.updateExpense(id, updates).catch(() => {});
    }
    return updated;
  }

  async getExpenses(flatId: string): Promise<Expense[]> {
    return this.turso.getExpenses(flatId);
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    return this.turso.getExpenseById(id);
  }

  async deleteExpense(id: string): Promise<boolean> {
    const deleted = await this.turso.deleteExpense(id);
    if (this.isAppGoogleSheetSyncEnabled()) {
      this.sheets.deleteExpense(id).catch(() => {});
    }
    return deleted;
  }

  // --- Settlements ---
  async createSettlement(settlement: Settlement): Promise<Settlement> {
    const saved = await this.turso.createSettlement(settlement);
    if (this.isAppGoogleSheetSyncEnabled()) {
      this.sheets.createSettlement(settlement).catch((err) => {
        console.warn('[DualSyncStore] Failed to mirror settlement to Google Sheets:', err);
      });
    }
    return saved;
  }

  async getSettlements(flatId: string): Promise<Settlement[]> {
    return this.turso.getSettlements(flatId);
  }

  // --- Statements ---
  async saveMonthlyStatement(statement: MonthlyStatement): Promise<void> {
    await this.turso.saveMonthlyStatement(statement);
    if (this.isAppGoogleSheetSyncEnabled()) {
      this.sheets.saveMonthlyStatement(statement).catch((err) => {
        console.warn('[DualSyncStore] Failed to mirror monthly statement to Google Sheets:', err);
      });
    }
  }

  async getMonthlyStatements(flatId: string): Promise<MonthlyStatement[]> {
    return this.turso.getMonthlyStatements(flatId);
  }
}
