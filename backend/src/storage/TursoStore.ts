import { createClient, Client } from '@libsql/client';
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

export class TursoStore implements IDataStore {
  private client: Client;

  constructor(url: string, authToken?: string) {
    this.client = createClient({
      url,
      authToken: authToken || undefined,
    });
  }

  async init(): Promise<void> {
    await this.client.batch(
      [
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          upi_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          invite_code TEXT UNIQUE NOT NULL,
          currency TEXT DEFAULT 'INR',
          google_sheet_sync INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS group_members (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL REFERENCES groups(id),
          user_email TEXT NOT NULL,
          name TEXT NOT NULL,
          upi_id TEXT,
          role TEXT DEFAULT 'MEMBER',
          is_away INTEGER DEFAULT 0,
          away_until TEXT,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(group_id, user_email)
        );`,

        `CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          group_id TEXT REFERENCES groups(id),
          flat_id TEXT,
          payer_email TEXT NOT NULL,
          title TEXT NOT NULL,
          amount_minor_units INTEGER NOT NULL,
          amount_display REAL NOT NULL,
          category TEXT NOT NULL,
          split_type TEXT NOT NULL,
          splits_json TEXT NOT NULL,
          utr_number TEXT,
          overwritten_flag TEXT DEFAULT 'NO',
          original_expense_id TEXT,
          duplicate_of_id TEXT,
          sheet_row_index INTEGER,
          sheet_row_link TEXT,
          history_log TEXT,
          sheet_sync_status TEXT DEFAULT 'PENDING',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS settlements (
          id TEXT PRIMARY KEY,
          group_id TEXT REFERENCES groups(id),
          flat_id TEXT,
          payer_email TEXT NOT NULL,
          receiver_email TEXT NOT NULL,
          amount_minor_units INTEGER NOT NULL,
          amount_display REAL NOT NULL,
          notes TEXT,
          settled_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,

        `CREATE TABLE IF NOT EXISTS monthly_statements (
          id TEXT PRIMARY KEY,
          group_id TEXT REFERENCES groups(id),
          flat_id TEXT,
          month_label TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          total_spend REAL NOT NULL,
          data_json TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
      ],
      'write'
    );

    // Safe auto-migration from legacy flats/flat_members to groups/group_members
    try {
      await this.client.execute(`
        INSERT OR IGNORE INTO groups (id, name, invite_code, currency, google_sheet_sync, created_at)
        SELECT id, name, invite_code, currency, google_sheet_sync, created_at FROM flats;
      `);
    } catch {}

    try {
      await this.client.execute(`
        INSERT OR IGNORE INTO group_members (id, group_id, user_email, name, upi_id, role, is_away, away_until, joined_at)
        SELECT id, flat_id, user_email, name, upi_id, role, is_away, away_until, joined_at FROM flat_members;
      `);
    } catch {}

    try {
      await this.client.execute('ALTER TABLE expenses ADD COLUMN group_id TEXT;');
    } catch {}
    try {
      await this.client.execute('UPDATE expenses SET group_id = flat_id WHERE group_id IS NULL;');
    } catch {}

    try {
      await this.client.execute('ALTER TABLE settlements ADD COLUMN group_id TEXT;');
    } catch {}
    try {
      await this.client.execute('UPDATE settlements SET group_id = flat_id WHERE group_id IS NULL;');
    } catch {}

    try {
      await this.client.execute('ALTER TABLE monthly_statements ADD COLUMN group_id TEXT;');
    } catch {}
    try {
      await this.client.execute('UPDATE monthly_statements SET group_id = flat_id WHERE group_id IS NULL;');
    } catch {}

    // Indexes
    try {
      await this.client.batch(
        [
          `CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);`,
          `CREATE INDEX IF NOT EXISTS idx_expenses_flat ON expenses(flat_id);`,
          `CREATE INDEX IF NOT EXISTS idx_expenses_utr ON expenses(group_id, utr_number);`,
          `CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);`,
          `CREATE INDEX IF NOT EXISTS idx_settlements_flat ON settlements(flat_id);`,
        ],
        'write'
      );
    } catch {}

    // Backward-compatible views if legacy queries run
    try {
      await this.client.execute(`CREATE VIEW IF NOT EXISTS flats AS SELECT id, name, invite_code, currency, google_sheet_sync, created_at FROM groups;`);
    } catch {}
    try {
      await this.client.execute(`CREATE VIEW IF NOT EXISTS flat_members AS SELECT id, group_id AS flat_id, user_email, name, upi_id, role, is_away, away_until, joined_at FROM group_members;`);
    } catch {}
  }

  // --- Groups (Primary) ---
  async createGroup(group: Group): Promise<Group> {
    const syncVal = group.googleSheetSync === false ? 0 : 1;
    await this.client.execute({
      sql: `INSERT INTO groups (id, name, invite_code, currency, google_sheet_sync, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [group.id, group.name, group.inviteCode, group.currency, syncVal, group.createdAt],
    });
    return { ...group, googleSheetSync: syncVal === 1 };
  }

  async createFlat(flat: Flat): Promise<Flat> {
    return this.createGroup(flat);
  }

  async getGroupById(groupId: string): Promise<Group | null> {
    const res = await this.client.execute({
      sql: `SELECT * FROM groups WHERE id = ?`,
      args: [groupId],
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      inviteCode: String(r.invite_code),
      currency: String(r.currency),
      googleSheetSync: r.google_sheet_sync === undefined || Number(r.google_sheet_sync) !== 0,
      createdAt: String(r.created_at),
    };
  }

  async getFlatById(flatId: string): Promise<Flat | null> {
    return this.getGroupById(flatId);
  }

  async getGroupByInviteCode(code: string): Promise<Group | null> {
    const res = await this.client.execute({
      sql: `SELECT * FROM groups WHERE UPPER(invite_code) = UPPER(?)`,
      args: [code.trim()],
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      inviteCode: String(r.invite_code),
      currency: String(r.currency),
      googleSheetSync: r.google_sheet_sync === undefined || Number(r.google_sheet_sync) !== 0,
      createdAt: String(r.created_at),
    };
  }

  async getFlatByInviteCode(code: string): Promise<Flat | null> {
    return this.getGroupByInviteCode(code);
  }

  async getAllGroups(): Promise<Group[]> {
    const res = await this.client.execute(`SELECT * FROM groups`);
    return res.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      inviteCode: String(r.invite_code),
      currency: String(r.currency),
      googleSheetSync: r.google_sheet_sync === undefined || Number(r.google_sheet_sync) !== 0,
      createdAt: String(r.created_at),
    }));
  }

  async getAllFlats(): Promise<Flat[]> {
    return this.getAllGroups();
  }

  async updateGroupSync(groupId: string, googleSheetSync: boolean): Promise<boolean> {
    const res = await this.client.execute({
      sql: `UPDATE groups SET google_sheet_sync = ? WHERE id = ?`,
      args: [googleSheetSync ? 1 : 0, groupId],
    });
    return res.rowsAffected > 0;
  }

  async updateFlatSync(flatId: string, googleSheetSync: boolean): Promise<boolean> {
    return this.updateGroupSync(flatId, googleSheetSync);
  }

  // --- Members ---
  async addMember(member: GroupMember): Promise<GroupMember> {
    const groupId = member.groupId || member.flatId!;
    await this.client.execute({
      sql: `INSERT INTO group_members (id, group_id, user_email, name, upi_id, role, is_away, away_until, joined_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(group_id, user_email) DO UPDATE SET
            name = excluded.name, upi_id = excluded.upi_id`,
      args: [
        member.id,
        groupId,
        member.userEmail,
        member.name,
        member.upiId || null,
        member.role,
        member.isAway ? 1 : 0,
        member.awayUntil || null,
        member.joinedAt,
      ],
    });
    return { ...member, groupId, flatId: groupId };
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    const res = await this.client.execute({
      sql: `SELECT * FROM group_members WHERE group_id = ? ORDER BY joined_at ASC`,
      args: [groupId],
    });
    return res.rows.map((r) => ({
      id: String(r.id),
      groupId: String(r.group_id),
      flatId: String(r.group_id),
      userEmail: String(r.user_email),
      name: String(r.name),
      upiId: r.upi_id ? String(r.upi_id) : undefined,
      role: r.role as any,
      isAway: Boolean(r.is_away),
      awayUntil: r.away_until ? String(r.away_until) : undefined,
      joinedAt: String(r.joined_at),
    }));
  }

  async getMember(groupId: string, userEmail: string): Promise<GroupMember | null> {
    const res = await this.client.execute({
      sql: `SELECT * FROM group_members WHERE group_id = ? AND user_email = ?`,
      args: [groupId, userEmail],
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      groupId: String(r.group_id),
      flatId: String(r.group_id),
      userEmail: String(r.user_email),
      name: String(r.name),
      upiId: r.upi_id ? String(r.upi_id) : undefined,
      role: r.role as any,
      isAway: Boolean(r.is_away),
      awayUntil: r.away_until ? String(r.away_until) : undefined,
      joinedAt: String(r.joined_at),
    };
  }

  async updateMemberAway(
    groupId: string,
    userEmail: string,
    isAway: boolean,
    awayUntil?: string
  ): Promise<boolean> {
    const res = await this.client.execute({
      sql: `UPDATE group_members SET is_away = ?, away_until = ? WHERE group_id = ? AND user_email = ?`,
      args: [isAway ? 1 : 0, awayUntil || null, groupId, userEmail],
    });
    return res.rowsAffected > 0;
  }

  // --- Expenses ---
  async createExpense(expense: Expense): Promise<Expense> {
    const groupId = expense.groupId || expense.flatId!;
    await this.client.execute({
      sql: `INSERT INTO expenses (
        id, group_id, flat_id, payer_email, title, amount_minor_units, amount_display,
        category, split_type, splits_json, utr_number, overwritten_flag,
        original_expense_id, duplicate_of_id, sheet_row_index, sheet_row_link,
        history_log, sheet_sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        expense.id,
        groupId,
        groupId,
        expense.payerEmail,
        expense.title,
        expense.totalAmountMinorUnits,
        expense.totalAmountDisplay,
        expense.category,
        expense.splitType,
        JSON.stringify(expense.splits),
        expense.utrNumber || null,
        expense.overwrittenFlag,
        expense.originalExpenseId || null,
        expense.duplicateOfId || null,
        expense.sheetRowIndex || null,
        expense.sheetRowLink || null,
        expense.historyLog || null,
        expense.sheetSyncStatus,
        expense.createdAt,
        expense.updatedAt,
      ],
    });
    return { ...expense, groupId, flatId: groupId };
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const existing = await this.getExpenseById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    await this.client.execute({
      sql: `UPDATE expenses SET
        title = ?, amount_minor_units = ?, amount_display = ?, category = ?,
        split_type = ?, splits_json = ?, utr_number = ?, overwritten_flag = ?,
        original_expense_id = ?, duplicate_of_id = ?, sheet_row_index = ?,
        sheet_row_link = ?, history_log = ?, sheet_sync_status = ?, updated_at = ?
        WHERE id = ?`,
      args: [
        merged.title,
        merged.totalAmountMinorUnits,
        merged.totalAmountDisplay,
        merged.category,
        merged.splitType,
        JSON.stringify(merged.splits),
        merged.utrNumber || null,
        merged.overwrittenFlag,
        merged.originalExpenseId || null,
        merged.duplicateOfId || null,
        merged.sheetRowIndex || null,
        merged.sheetRowLink || null,
        merged.historyLog || null,
        merged.sheetSyncStatus,
        merged.updatedAt,
        id,
      ],
    });

    return merged;
  }

  async getExpenses(groupId: string): Promise<Expense[]> {
    const res = await this.client.execute({
      sql: `SELECT * FROM expenses WHERE (group_id = ? OR flat_id = ?) ORDER BY created_at DESC`,
      args: [groupId, groupId],
    });
    return res.rows.map((r) => this.mapExpenseRow(r));
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const res = await this.client.execute({
      sql: `SELECT * FROM expenses WHERE id = ?`,
      args: [id],
    });
    if (res.rows.length === 0) return null;
    return this.mapExpenseRow(res.rows[0]);
  }

  async deleteExpense(id: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: `DELETE FROM expenses WHERE id = ?`,
      args: [id],
    });
    return res.rowsAffected > 0;
  }

  // --- Settlements ---
  async createSettlement(settlement: Settlement): Promise<Settlement> {
    const groupId = settlement.groupId || settlement.flatId!;
    await this.client.execute({
      sql: `INSERT INTO settlements (id, group_id, flat_id, payer_email, receiver_email, amount_minor_units, amount_display, notes, settled_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        settlement.id,
        groupId,
        groupId,
        settlement.payerEmail,
        settlement.receiverEmail,
        settlement.amountMinorUnits,
        settlement.amountDisplay,
        settlement.notes || null,
        settlement.settledAt,
      ],
    });
    return { ...settlement, groupId, flatId: groupId };
  }

  async getSettlements(groupId: string): Promise<Settlement[]> {
    const res = await this.client.execute({
      sql: `SELECT * FROM settlements WHERE (group_id = ? OR flat_id = ?) ORDER BY settled_at DESC`,
      args: [groupId, groupId],
    });
    return res.rows.map((r) => ({
      id: String(r.id),
      groupId: String(r.group_id || r.flat_id),
      flatId: String(r.group_id || r.flat_id),
      payerEmail: String(r.payer_email),
      receiverEmail: String(r.receiver_email),
      amountMinorUnits: Number(r.amount_minor_units),
      amountDisplay: Number(r.amount_display),
      notes: r.notes ? String(r.notes) : undefined,
      settledAt: String(r.settled_at),
    }));
  }

  // --- Statements ---
  async saveMonthlyStatement(statement: MonthlyStatement): Promise<void> {
    const groupId = statement.groupId || statement.flatId!;
    const id = `stmt_${groupId}_${statement.startDate.slice(0, 7)}`;
    await this.client.execute({
      sql: `INSERT INTO monthly_statements (id, group_id, flat_id, month_label, start_date, end_date, total_spend, data_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json`,
      args: [
        id,
        groupId,
        groupId,
        statement.periodLabel,
        statement.startDate,
        statement.endDate,
        statement.totalSpendDisplay,
        JSON.stringify(statement),
        statement.createdAt,
      ],
    });
  }

  async getMonthlyStatements(groupId: string): Promise<MonthlyStatement[]> {
    const res = await this.client.execute({
      sql: `SELECT * FROM monthly_statements WHERE (group_id = ? OR flat_id = ?) ORDER BY start_date DESC`,
      args: [groupId, groupId],
    });
    return res.rows.map((r) => JSON.parse(String(r.data_json)));
  }

  private mapExpenseRow(r: any): Expense {
    const groupId = String(r.group_id || r.flat_id);
    return {
      id: String(r.id),
      groupId,
      flatId: groupId,
      payerEmail: String(r.payer_email),
      title: String(r.title),
      totalAmountMinorUnits: Number(r.amount_minor_units),
      totalAmountDisplay: Number(r.amount_display),
      category: r.category as any,
      splitType: r.split_type as any,
      splits: JSON.parse(String(r.splits_json)),
      utrNumber: r.utr_number ? String(r.utr_number) : undefined,
      overwrittenFlag: r.overwritten_flag as any,
      originalExpenseId: r.original_expense_id ? String(r.original_expense_id) : undefined,
      duplicateOfId: r.duplicate_of_id ? String(r.duplicate_of_id) : undefined,
      sheetRowIndex: r.sheet_row_index ? Number(r.sheet_row_index) : undefined,
      sheetRowLink: r.sheet_row_link ? String(r.sheet_row_link) : undefined,
      historyLog: r.history_log ? String(r.history_log) : undefined,
      sheetSyncStatus: r.sheet_sync_status as any,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }
}
