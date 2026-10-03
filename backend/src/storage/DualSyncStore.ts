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
import { appConfig } from '../config/appConfig.js';

export class DualSyncStore implements IDataStore {
  constructor(
    private turso: TursoStore,
    private sheets: GoogleSheetsStore,
  ) {}

  public isAppGoogleSheetSyncEnabled(): boolean {
    return appConfig.googleSheetSync && process.env.STORAGE_MODE !== 'turso';
  }

  public setAppGoogleSheetSync(enabled: boolean): void {
    appConfig.googleSheetSync = enabled;
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
  async addMember(member: GroupMember): Promise<GroupMember> {
    const saved = await this.turso.addMember(member);
    const groupId = member.groupId || member.flatId!;
    if (this.isAppGoogleSheetSyncEnabled()) {
      const group = await this.turso.getGroupById(groupId);
      if (group?.googleSheetSync !== false) {
        this.sheets.addMember(member).catch((err) => {
          console.warn('[DualSyncStore] Failed to mirror member to Google Sheets:', err);
        });
      }
    }
    return saved;
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    return this.turso.getMembers(groupId);
  }

  async getMember(groupId: string, userEmail: string): Promise<GroupMember | null> {
    return this.turso.getMember(groupId, userEmail);
  }

  async getUserGroups(userEmail: string): Promise<any[]> {
    return this.turso.getUserGroups(userEmail);
  }

  async updateMemberStatus(groupId: string, userEmail: string, status: string): Promise<boolean> {
    return this.turso.updateMemberStatus(groupId, userEmail, status);
  }

  async updateMemberRole(groupId: string, userEmail: string, role: string): Promise<boolean> {
    return this.turso.updateMemberRole(groupId, userEmail, role);
  }

  async removeMember(groupId: string, userEmail: string): Promise<boolean> {
    return this.turso.removeMember(groupId, userEmail);
  }

  async updateMemberAway(
    groupId: string,
    userEmail: string,
    isAway: boolean,
    awayUntil?: string,
  ): Promise<boolean> {
    return this.turso.updateMemberAway(groupId, userEmail, isAway, awayUntil);
  }

  // --- Expenses ---
  async createExpense(expense: Expense): Promise<Expense> {
    // 1. Primary write to Turso (Fast ACID edge commit)
    const saved = await this.turso.createExpense(expense);
    const groupId = expense.groupId || expense.flatId!;

    // 2. Check if App-level or Group-level Google Sheet Sync is enabled
    if (!this.isAppGoogleSheetSyncEnabled()) {
      await this.turso.updateExpense(saved.id, { sheetSyncStatus: 'SYNCED' });
      return saved;
    }

    const group = await this.turso.getGroupById(groupId);
    if (group && group.googleSheetSync === false) {
      // Sync disabled for this group!
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
        console.warn(
          `[DualSyncStore] Google Sheet sync deferred for expense ${saved.id}:`,
          err.message,
        );
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

  async getExpenses(groupId: string): Promise<Expense[]> {
    return this.turso.getExpenses(groupId);
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

  async getSettlements(groupId: string): Promise<Settlement[]> {
    return this.turso.getSettlements(groupId);
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

  async getMonthlyStatements(groupId: string): Promise<MonthlyStatement[]> {
    return this.turso.getMonthlyStatements(groupId);
  }
}
