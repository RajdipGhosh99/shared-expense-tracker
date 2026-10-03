import { createClient } from '@libsql/client/web';
import { DEFAULT_GROUP_FORM_CONTROLS, } from '@shared-expense-tracker/shared';
export class TursoStore {
    client;
    constructor(url, authToken) {
        this.client = createClient({
            url,
            authToken: authToken || undefined,
        });
    }
    async init() {
        await this.client.batch([
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
          status TEXT DEFAULT 'ACTIVE',
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
            `CREATE TABLE IF NOT EXISTS group_invites (
          id TEXT PRIMARY KEY,
          group_id TEXT NOT NULL REFERENCES groups(id),
          invite_code TEXT UNIQUE NOT NULL,
          invitee_name TEXT NOT NULL,
          invitee_email TEXT NOT NULL,
          effective_move_in_date DATE NOT NULL,
          created_by TEXT NOT NULL,
          status TEXT DEFAULT 'PENDING',
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        ], 'write');
        // Safe auto-migration from legacy flats/flat_members to groups/group_members
        try {
            await this.client.execute(`
        INSERT OR IGNORE INTO groups (id, name, invite_code, currency, google_sheet_sync, created_at)
        SELECT id, name, invite_code, currency, google_sheet_sync, created_at FROM flats;
      `);
        }
        catch { }
        try {
            await this.client.execute(`
        INSERT OR IGNORE INTO group_members (id, group_id, user_email, name, upi_id, role, is_away, away_until, joined_at)
        SELECT id, flat_id, user_email, name, upi_id, role, is_away, away_until, joined_at FROM flat_members;
      `);
        }
        catch { }
        try {
            await this.client.execute('ALTER TABLE expenses ADD COLUMN group_id TEXT;');
        }
        catch { }
        try {
            await this.client.execute('ALTER TABLE groups ADD COLUMN form_controls TEXT;');
        }
        catch { }
        try {
            await this.client.execute('ALTER TABLE expenses ADD COLUMN sub_category TEXT;');
        }
        catch { }
        try {
            await this.client.execute('ALTER TABLE expenses ADD COLUMN notes TEXT;');
        }
        catch { }
        try {
            await this.client.execute('ALTER TABLE expenses ADD COLUMN is_expense INTEGER DEFAULT 1;');
        }
        catch { }
        try {
            await this.client.execute("ALTER TABLE group_members ADD COLUMN status TEXT DEFAULT 'ACTIVE';");
        }
        catch { }
        try {
            await this.client.execute('UPDATE expenses SET group_id = flat_id WHERE group_id IS NULL;');
        }
        catch { }
        try {
            await this.client.execute('ALTER TABLE settlements ADD COLUMN group_id TEXT;');
        }
        catch { }
        try {
            await this.client.execute('UPDATE settlements SET group_id = flat_id WHERE group_id IS NULL;');
        }
        catch { }
        try {
            await this.client.execute('ALTER TABLE monthly_statements ADD COLUMN group_id TEXT;');
        }
        catch { }
        try {
            await this.client.execute('UPDATE monthly_statements SET group_id = flat_id WHERE group_id IS NULL;');
        }
        catch { }
        // Tenancy & billing period migrations
        try {
            await this.client.execute("ALTER TABLE group_members ADD COLUMN moved_in_at TEXT;");
        }
        catch { }
        try {
            await this.client.execute("ALTER TABLE group_members ADD COLUMN moved_out_at TEXT;");
        }
        catch { }
        try {
            await this.client.execute("ALTER TABLE expenses ADD COLUMN expense_date TEXT;");
        }
        catch { }
        try {
            await this.client.execute("ALTER TABLE expenses ADD COLUMN billing_period_start TEXT;");
        }
        catch { }
        try {
            await this.client.execute("ALTER TABLE expenses ADD COLUMN billing_period_end TEXT;");
        }
        catch { }
        try {
            await this.client.execute("UPDATE expenses SET expense_date = COALESCE(SUBSTR(created_at, 1, 10), DATE('now')) WHERE expense_date IS NULL;");
        }
        catch { }
        try {
            await this.client.execute("UPDATE group_members SET moved_in_at = COALESCE(SUBSTR(joined_at, 1, 10), DATE('now')) WHERE moved_in_at IS NULL;");
        }
        catch { }
        // Indexes
        try {
            await this.client.batch([
                `CREATE INDEX IF NOT EXISTS idx_expenses_group ON expenses(group_id);`,
                `CREATE INDEX IF NOT EXISTS idx_expenses_flat ON expenses(flat_id);`,
                `CREATE INDEX IF NOT EXISTS idx_expenses_utr ON expenses(group_id, utr_number);`,
                `CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);`,
                `CREATE INDEX IF NOT EXISTS idx_settlements_flat ON settlements(flat_id);`,
            ], 'write');
        }
        catch { }
        // Backward-compatible views if legacy queries run
        try {
            await this.client.execute(`CREATE VIEW IF NOT EXISTS flats AS SELECT id, name, invite_code, currency, google_sheet_sync, created_at FROM groups;`);
        }
        catch { }
        try {
            await this.client.execute(`CREATE VIEW IF NOT EXISTS flat_members AS SELECT id, group_id AS flat_id, user_email, name, upi_id, role, is_away, away_until, joined_at FROM group_members;`);
        }
        catch { }
    }
    // --- Users & Auth ---
    async createUser(user) {
        const cleanEmail = user.email.toLowerCase().trim();
        const createdAt = new Date().toISOString();
        await this.client.execute({
            sql: `INSERT INTO users (id, email, password_hash, name, upi_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
              password_hash = excluded.password_hash,
              name = excluded.name,
              upi_id = COALESCE(excluded.upi_id, users.upi_id)`,
            args: [user.id, cleanEmail, user.passwordHash, user.name, user.upiId || null, createdAt],
        });
        return {
            id: user.id,
            email: cleanEmail,
            passwordHash: user.passwordHash,
            name: user.name,
            upiId: user.upiId,
            createdAt,
        };
    }
    async getUserByEmail(email) {
        const cleanEmail = email.toLowerCase().trim();
        const res = await this.client.execute({
            sql: `SELECT id, email, password_hash, name, upi_id, created_at FROM users WHERE LOWER(email) = ? LIMIT 1`,
            args: [cleanEmail],
        });
        if (res.rows.length === 0)
            return null;
        const row = res.rows[0];
        return {
            id: String(row.id),
            email: String(row.email),
            passwordHash: String(row.password_hash),
            name: String(row.name),
            upiId: row.upi_id ? String(row.upi_id) : undefined,
            createdAt: row.created_at ? String(row.created_at) : undefined,
        };
    }
    async deleteUserByEmail(email) {
        const cleanEmail = email.toLowerCase().trim();
        const res = await this.client.execute({
            sql: `DELETE FROM users WHERE LOWER(email) = ?`,
            args: [cleanEmail],
        });
        return res.rowsAffected > 0;
    }
    // --- Groups (Primary) ---
    async createGroup(group) {
        const syncVal = group.googleSheetSync === false ? 0 : 1;
        await this.client.execute({
            sql: `INSERT INTO groups (id, name, invite_code, currency, google_sheet_sync, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
            args: [group.id, group.name, group.inviteCode, group.currency, syncVal, group.createdAt],
        });
        return { ...group, googleSheetSync: syncVal === 1 };
    }
    async createFlat(flat) {
        return this.createGroup(flat);
    }
    async getGroupById(groupId) {
        const res = await this.client.execute({
            sql: `SELECT * FROM groups WHERE id = ?`,
            args: [groupId],
        });
        if (res.rows.length === 0)
            return null;
        const r = res.rows[0];
        return {
            id: String(r.id),
            name: String(r.name),
            inviteCode: String(r.invite_code),
            currency: String(r.currency),
            googleSheetSync: r.google_sheet_sync === undefined || Number(r.google_sheet_sync) !== 0,
            formControls: r.form_controls
                ? JSON.parse(String(r.form_controls))
                : DEFAULT_GROUP_FORM_CONTROLS,
            createdAt: String(r.created_at),
        };
    }
    async getFlatById(flatId) {
        return this.getGroupById(flatId);
    }
    async getGroupByInviteCode(code) {
        const res = await this.client.execute({
            sql: `SELECT * FROM groups WHERE UPPER(invite_code) = UPPER(?)`,
            args: [code.trim()],
        });
        if (res.rows.length === 0)
            return null;
        const r = res.rows[0];
        return {
            id: String(r.id),
            name: String(r.name),
            inviteCode: String(r.invite_code),
            currency: String(r.currency),
            googleSheetSync: r.google_sheet_sync === undefined || Number(r.google_sheet_sync) !== 0,
            formControls: r.form_controls
                ? JSON.parse(String(r.form_controls))
                : DEFAULT_GROUP_FORM_CONTROLS,
            createdAt: String(r.created_at),
        };
    }
    async getFlatByInviteCode(code) {
        return this.getGroupByInviteCode(code);
    }
    async getAllGroups() {
        const res = await this.client.execute(`SELECT * FROM groups`);
        return res.rows.map((r) => ({
            id: String(r.id),
            name: String(r.name),
            inviteCode: String(r.invite_code),
            currency: String(r.currency),
            googleSheetSync: r.google_sheet_sync === undefined || Number(r.google_sheet_sync) !== 0,
            formControls: r.form_controls
                ? JSON.parse(String(r.form_controls))
                : DEFAULT_GROUP_FORM_CONTROLS,
            createdAt: String(r.created_at),
        }));
    }
    async getAllFlats() {
        return this.getAllGroups();
    }
    async updateGroupSync(groupId, googleSheetSync) {
        const res = await this.client.execute({
            sql: `UPDATE groups SET google_sheet_sync = ? WHERE id = ?`,
            args: [googleSheetSync ? 1 : 0, groupId],
        });
        return res.rowsAffected > 0;
    }
    async updateFlatSync(flatId, googleSheetSync) {
        return this.updateGroupSync(flatId, googleSheetSync);
    }
    async updateGroupFormControls(groupId, formControls) {
        const res = await this.client.execute({
            sql: `UPDATE groups SET form_controls = ? WHERE id = ?`,
            args: [JSON.stringify(formControls), groupId],
        });
        return res.rowsAffected > 0;
    }
    // --- Members ---
    async addMember(member) {
        const groupId = member.groupId || member.flatId;
        const status = member.status || 'ACTIVE';
        const movedInAt = member.movedInAt || new Date().toISOString().slice(0, 10);
        const movedOutAt = member.movedOutAt || null;
        await this.client.execute({
            sql: `INSERT INTO group_members (id, group_id, user_email, name, upi_id, role, status, is_away, away_until, joined_at, moved_in_at, moved_out_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(group_id, user_email) DO UPDATE SET
            name = excluded.name, upi_id = excluded.upi_id, role = excluded.role, status = excluded.status,
            moved_in_at = COALESCE(excluded.moved_in_at, group_members.moved_in_at),
            moved_out_at = excluded.moved_out_at`,
            args: [
                member.id,
                groupId,
                member.userEmail.toLowerCase().trim(),
                member.name,
                member.upiId || null,
                member.role,
                status,
                member.isAway ? 1 : 0,
                member.awayUntil || null,
                member.joinedAt,
                movedInAt,
                movedOutAt,
            ],
        });
        return { ...member, groupId, flatId: groupId, status, movedInAt, movedOutAt: movedOutAt || undefined };
    }
    async getMembers(groupId) {
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
            role: r.role,
            status: r.status || 'ACTIVE',
            isAway: Boolean(r.is_away),
            awayUntil: r.away_until ? String(r.away_until) : undefined,
            joinedAt: String(r.joined_at),
            movedInAt: r.moved_in_at
                ? String(r.moved_in_at)
                : r.joined_at
                    ? String(r.joined_at).slice(0, 10)
                    : undefined,
            movedOutAt: r.moved_out_at ? String(r.moved_out_at) : undefined,
        }));
    }
    async getMember(groupId, userEmail) {
        const res = await this.client.execute({
            sql: `SELECT * FROM group_members WHERE group_id = ? AND LOWER(user_email) = LOWER(?)`,
            args: [groupId, userEmail.trim()],
        });
        if (res.rows.length === 0)
            return null;
        const r = res.rows[0];
        return {
            id: String(r.id),
            groupId: String(r.group_id),
            flatId: String(r.group_id),
            userEmail: String(r.user_email),
            name: String(r.name),
            upiId: r.upi_id ? String(r.upi_id) : undefined,
            role: r.role,
            status: r.status || 'ACTIVE',
            isAway: Boolean(r.is_away),
            awayUntil: r.away_until ? String(r.away_until) : undefined,
            joinedAt: String(r.joined_at),
            movedInAt: r.moved_in_at
                ? String(r.moved_in_at)
                : r.joined_at
                    ? String(r.joined_at).slice(0, 10)
                    : undefined,
            movedOutAt: r.moved_out_at ? String(r.moved_out_at) : undefined,
        };
    }
    async getUserGroups(userEmail) {
        const res = await this.client.execute({
            sql: `SELECT g.*, gm.role, gm.status, gm.joined_at
            FROM groups g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE LOWER(gm.user_email) = LOWER(?)
            ORDER BY gm.joined_at DESC`,
            args: [userEmail.trim()],
        });
        return res.rows.map((r) => {
            const group = {
                id: String(r.id),
                name: String(r.name),
                inviteCode: String(r.invite_code),
                currency: String(r.currency || 'INR'),
                googleSheetSync: r.google_sheet_sync === undefined || Number(r.google_sheet_sync) !== 0,
                createdAt: String(r.created_at),
            };
            return {
                group,
                flat: group,
                role: r.role || 'MEMBER',
                status: r.status || 'ACTIVE',
                joinedAt: String(r.joined_at),
            };
        });
    }
    async updateMemberStatus(groupId, userEmail, status) {
        const res = await this.client.execute({
            sql: `UPDATE group_members SET status = ? WHERE group_id = ? AND LOWER(user_email) = LOWER(?)`,
            args: [status, groupId, userEmail.trim()],
        });
        return res.rowsAffected > 0;
    }
    async updateMemberRole(groupId, userEmail, role) {
        const res = await this.client.execute({
            sql: `UPDATE group_members SET role = ? WHERE group_id = ? AND LOWER(user_email) = LOWER(?)`,
            args: [role, groupId, userEmail.trim()],
        });
        return res.rowsAffected > 0;
    }
    async removeMember(groupId, userEmail) {
        const res = await this.client.execute({
            sql: `DELETE FROM group_members WHERE group_id = ? AND LOWER(user_email) = LOWER(?)`,
            args: [groupId, userEmail.trim()],
        });
        return res.rowsAffected > 0;
    }
    async updateMemberAway(groupId, userEmail, isAway, awayUntil) {
        const res = await this.client.execute({
            sql: `UPDATE group_members SET is_away = ?, away_until = ? WHERE group_id = ? AND LOWER(user_email) = LOWER(?)`,
            args: [isAway ? 1 : 0, awayUntil || null, groupId, userEmail.trim()],
        });
        return res.rowsAffected > 0;
    }
    async updateMemberTenancy(groupId, userEmail, movedInAt, movedOutAt) {
        const normalizedEmail = userEmail.toLowerCase().trim();
        const statusClause = movedOutAt ? ", status = 'LEFT'" : "";
        const res = await this.client.execute({
            sql: `UPDATE group_members SET moved_in_at = ?, moved_out_at = ?${statusClause} WHERE group_id = ? AND LOWER(user_email) = LOWER(?)`,
            args: [movedInAt, movedOutAt || null, groupId, normalizedEmail],
        });
        return res.rowsAffected > 0;
    }
    async getEligibleMembers(groupId, date) {
        const targetDate = date ? date.slice(0, 10) : new Date().toISOString().slice(0, 10);
        const memRes = await this.client.execute({
            sql: `SELECT * FROM group_members WHERE group_id = ? ORDER BY joined_at ASC`,
            args: [groupId],
        });
        const eligibleMembers = [];
        for (const r of memRes.rows) {
            const movedInAt = r.moved_in_at ? String(r.moved_in_at) : String(r.joined_at).slice(0, 10);
            const movedOutAt = r.moved_out_at ? String(r.moved_out_at) : undefined;
            const memberStatus = r.status || 'ACTIVE';
            let eligibilityStatus = 'ACTIVE';
            if (movedInAt > targetDate) {
                eligibilityStatus = 'NOT_YET_MOVED_IN';
            }
            else if (movedOutAt && movedOutAt < targetDate) {
                eligibilityStatus = 'MOVED_OUT';
            }
            else if (memberStatus === 'LEFT') {
                eligibilityStatus = 'MOVED_OUT';
            }
            else {
                eligibilityStatus = 'ACTIVE';
            }
            eligibleMembers.push({
                userEmail: String(r.user_email),
                name: String(r.name),
                upiId: r.upi_id ? String(r.upi_id) : undefined,
                role: r.role,
                movedInAt,
                movedOutAt,
                isAway: Boolean(r.is_away),
                isPendingInvite: false,
                eligibilityStatus,
            });
        }
        const invRes = await this.client.execute({
            sql: `SELECT * FROM group_invites
            WHERE group_id = ? AND status = 'PENDING' AND expires_at > datetime('now')
            ORDER BY created_at ASC`,
            args: [groupId],
        });
        const existingEmails = new Set(eligibleMembers.map((m) => m.userEmail.toLowerCase()));
        for (const r of invRes.rows) {
            const email = String(r.invitee_email).toLowerCase().trim();
            if (existingEmails.has(email))
                continue;
            const effectiveMoveInDate = String(r.effective_move_in_date);
            let eligibilityStatus = 'PENDING_INVITE';
            if (effectiveMoveInDate > targetDate) {
                eligibilityStatus = 'NOT_YET_MOVED_IN';
            }
            else {
                eligibilityStatus = 'PENDING_INVITE';
            }
            eligibleMembers.push({
                userEmail: email,
                name: String(r.invitee_name),
                role: 'MEMBER',
                movedInAt: effectiveMoveInDate,
                isPendingInvite: true,
                effectiveMoveInDate,
                eligibilityStatus,
            });
        }
        return eligibleMembers;
    }
    // --- Group Invites ---
    async createGroupInvite(invite) {
        await this.client.execute({
            sql: `INSERT INTO group_invites (
        id, group_id, invite_code, invitee_name, invitee_email, effective_move_in_date,
        created_by, status, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                invite.id,
                invite.groupId,
                invite.inviteCode,
                invite.inviteeName,
                invite.inviteeEmail.toLowerCase().trim(),
                invite.effectiveMoveInDate,
                invite.createdBy.toLowerCase().trim(),
                invite.status || 'PENDING',
                invite.expiresAt,
                invite.createdAt,
            ],
        });
        return invite;
    }
    async getGroupInviteByCode(inviteCode) {
        const res = await this.client.execute({
            sql: `SELECT * FROM group_invites WHERE UPPER(invite_code) = UPPER(?) LIMIT 1`,
            args: [inviteCode.trim()],
        });
        if (res.rows.length === 0)
            return null;
        const r = res.rows[0];
        return {
            id: String(r.id),
            groupId: String(r.group_id),
            inviteCode: String(r.invite_code),
            inviteeName: String(r.invitee_name),
            inviteeEmail: String(r.invitee_email),
            effectiveMoveInDate: String(r.effective_move_in_date),
            createdBy: String(r.created_by),
            status: r.status,
            expiresAt: String(r.expires_at),
            createdAt: String(r.created_at),
        };
    }
    async getGroupInvitesByGroup(groupId) {
        const res = await this.client.execute({
            sql: `SELECT * FROM group_invites WHERE group_id = ? ORDER BY created_at DESC`,
            args: [groupId],
        });
        return res.rows.map((r) => ({
            id: String(r.id),
            groupId: String(r.group_id),
            inviteCode: String(r.invite_code),
            inviteeName: String(r.invitee_name),
            inviteeEmail: String(r.invitee_email),
            effectiveMoveInDate: String(r.effective_move_in_date),
            createdBy: String(r.created_by),
            status: r.status,
            expiresAt: String(r.expires_at),
            createdAt: String(r.created_at),
        }));
    }
    async getPendingInviteByEmail(groupId, email) {
        const res = await this.client.execute({
            sql: `SELECT * FROM group_invites WHERE group_id = ? AND LOWER(invitee_email) = LOWER(?) AND status = 'PENDING' LIMIT 1`,
            args: [groupId, email.trim()],
        });
        if (res.rows.length === 0)
            return null;
        const r = res.rows[0];
        return {
            id: String(r.id),
            groupId: String(r.group_id),
            inviteCode: String(r.invite_code),
            inviteeName: String(r.invitee_name),
            inviteeEmail: String(r.invitee_email),
            effectiveMoveInDate: String(r.effective_move_in_date),
            createdBy: String(r.created_by),
            status: r.status,
            expiresAt: String(r.expires_at),
            createdAt: String(r.created_at),
        };
    }
    async updateGroupInviteStatus(inviteId, status) {
        const res = await this.client.execute({
            sql: `UPDATE group_invites SET status = ? WHERE id = ?`,
            args: [status, inviteId],
        });
        return res.rowsAffected > 0;
    }
    // --- Expenses ---
    async createExpense(expense) {
        const groupId = expense.groupId || expense.flatId;
        const isExpense = expense.isExpense !== undefined
            ? expense.isExpense
            : expense.category !== 'Transfers & Adjustments' &&
                expense.category !== 'Transfers & Settlements';
        const expenseDate = expense.expenseDate || expense.date || new Date().toISOString().slice(0, 10);
        await this.client.execute({
            sql: `INSERT INTO expenses (
        id, group_id, flat_id, payer_email, title, amount_minor_units, amount_display,
        category, sub_category, notes, is_expense, split_type, splits_json, utr_number, overwritten_flag,
        original_expense_id, duplicate_of_id, sheet_row_index, sheet_row_link,
        history_log, sheet_sync_status, expense_date, billing_period_start, billing_period_end, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                expense.id,
                groupId,
                groupId,
                expense.payerEmail,
                expense.title,
                expense.totalAmountMinorUnits,
                expense.totalAmountDisplay,
                expense.category,
                expense.subCategory || null,
                expense.notes || null,
                isExpense ? 1 : 0,
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
                expenseDate,
                expense.billingPeriodStart || null,
                expense.billingPeriodEnd || null,
                expense.createdAt,
                expense.updatedAt,
            ],
        });
        return { ...expense, isExpense, groupId, flatId: groupId, date: expenseDate, expenseDate };
    }
    async updateExpense(id, updates) {
        const existing = await this.getExpenseById(id);
        if (!existing)
            return null;
        const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        const isExpense = merged.isExpense !== undefined
            ? merged.isExpense
            : merged.category !== 'Transfers & Adjustments' &&
                merged.category !== 'Transfers & Settlements';
        const expenseDate = merged.expenseDate || merged.date || existing.date;
        await this.client.execute({
            sql: `UPDATE expenses SET
        title = ?, amount_minor_units = ?, amount_display = ?, category = ?, sub_category = ?, notes = ?, is_expense = ?,
        split_type = ?, splits_json = ?, utr_number = ?, overwritten_flag = ?,
        original_expense_id = ?, duplicate_of_id = ?, sheet_row_index = ?,
        sheet_row_link = ?, history_log = ?, sheet_sync_status = ?,
        expense_date = ?, billing_period_start = ?, billing_period_end = ?, updated_at = ?
        WHERE id = ?`,
            args: [
                merged.title,
                merged.totalAmountMinorUnits,
                merged.totalAmountDisplay,
                merged.category,
                merged.subCategory || null,
                merged.notes || null,
                isExpense ? 1 : 0,
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
                expenseDate,
                merged.billingPeriodStart || null,
                merged.billingPeriodEnd || null,
                merged.updatedAt,
                id,
            ],
        });
        return { ...merged, isExpense };
    }
    async getExpenses(groupId) {
        const res = await this.client.execute({
            sql: `SELECT * FROM expenses WHERE (group_id = ? OR flat_id = ?) ORDER BY created_at DESC`,
            args: [groupId, groupId],
        });
        return res.rows.map((r) => this.mapExpenseRow(r));
    }
    async getExpenseById(id) {
        const res = await this.client.execute({
            sql: `SELECT * FROM expenses WHERE id = ?`,
            args: [id],
        });
        if (res.rows.length === 0)
            return null;
        return this.mapExpenseRow(res.rows[0]);
    }
    async deleteExpense(id) {
        const res = await this.client.execute({
            sql: `DELETE FROM expenses WHERE id = ?`,
            args: [id],
        });
        return res.rowsAffected > 0;
    }
    // --- Settlements ---
    async createSettlement(settlement) {
        const groupId = settlement.groupId || settlement.flatId;
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
    async getSettlements(groupId) {
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
    async saveMonthlyStatement(statement) {
        const groupId = statement.groupId || statement.flatId;
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
    async getMonthlyStatements(groupId) {
        const res = await this.client.execute({
            sql: `SELECT * FROM monthly_statements WHERE (group_id = ? OR flat_id = ?) ORDER BY start_date DESC`,
            args: [groupId, groupId],
        });
        return res.rows.map((r) => JSON.parse(String(r.data_json)));
    }
    mapExpenseRow(r) {
        const groupId = String(r.group_id || r.flat_id);
        const category = r.category;
        const isExpense = r.is_expense !== null && r.is_expense !== undefined
            ? Boolean(r.is_expense)
            : category !== 'Transfers & Adjustments' && category !== 'Transfers & Settlements';
        return {
            id: String(r.id),
            groupId,
            flatId: groupId,
            payerEmail: String(r.payer_email),
            title: String(r.title),
            date: r.expense_date ? String(r.expense_date) : String(r.created_at).slice(0, 10),
            expenseDate: r.expense_date ? String(r.expense_date) : String(r.created_at).slice(0, 10),
            billingPeriodStart: r.billing_period_start ? String(r.billing_period_start) : undefined,
            billingPeriodEnd: r.billing_period_end ? String(r.billing_period_end) : undefined,
            totalAmountMinorUnits: Number(r.amount_minor_units),
            totalAmountDisplay: Number(r.amount_display),
            category,
            subCategory: r.sub_category ? String(r.sub_category) : undefined,
            notes: r.notes ? String(r.notes) : undefined,
            isExpense,
            splitType: r.split_type,
            splits: JSON.parse(String(r.splits_json)),
            utrNumber: r.utr_number ? String(r.utr_number) : undefined,
            overwrittenFlag: r.overwritten_flag,
            originalExpenseId: r.original_expense_id ? String(r.original_expense_id) : undefined,
            duplicateOfId: r.duplicate_of_id ? String(r.duplicate_of_id) : undefined,
            sheetRowIndex: r.sheet_row_index ? Number(r.sheet_row_index) : undefined,
            sheetRowLink: r.sheet_row_link ? String(r.sheet_row_link) : undefined,
            historyLog: r.history_log ? String(r.history_log) : undefined,
            sheetSyncStatus: r.sheet_sync_status,
            createdAt: String(r.created_at),
            updatedAt: String(r.updated_at),
        };
    }
}
//# sourceMappingURL=TursoStore.js.map