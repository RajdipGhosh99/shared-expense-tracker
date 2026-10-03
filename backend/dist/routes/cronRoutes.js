import { Router } from 'express';
import { getStorage } from '../storage/index.js';
import { generateStatement } from '../services/statementService.js';
const router = Router();
// Endpoint triggered by GitHub Actions Cron
router.post('/month-end-statement', async (req, res) => {
    const cronSecret = process.env.CRON_SECRET || 'github_actions_cron_secret_token_12345';
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET token' });
    }
    const db = getStorage();
    const groups = await db.getAllGroups();
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];
    const monthLabel = lastMonth.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
    });
    const results = [];
    for (const group of groups) {
        try {
            const statement = await generateStatement({ flatId: group.id, startDate, endDate, monthLabel }, db);
            // Save immutable snapshot to Turso & Google Sheet
            await db.saveMonthlyStatement(statement);
            results.push({
                groupId: group.id,
                flatId: group.id,
                groupName: group.name,
                flatName: group.name,
                status: 'ARCHIVED',
            });
        }
        catch (err) {
            console.error(`[Cron] Failed to archive statement for group ${group.id}:`, err);
            results.push({ groupId: group.id, flatId: group.id, status: 'ERROR', message: err.message });
        }
    }
    return res.json({
        success: true,
        month: monthLabel,
        groupsProcessed: results.length,
        flatsProcessed: results.length,
        results,
    });
});
export default router;
//# sourceMappingURL=cronRoutes.js.map