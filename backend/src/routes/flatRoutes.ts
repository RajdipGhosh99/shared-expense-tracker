import { Router, Response } from 'express';
import { getStorage } from '../storage/index.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { Group, GroupMember } from '@shared-expense-tracker/shared';

const router = Router();

// Create new group / flat
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, currency } = req.body;
  const user = req.user!;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Group name is required.' });
  }

  const db = getStorage();
  const groupId = `group_${Date.now()}`;
  // Generate random 6-character uppercase invite code (e.g. GRP4X)
  const inviteCode = (name.replace(/[^A-Za-z]/g, '').slice(0, 3) + Math.random().toString(36).slice(2, 5)).toUpperCase();

  const group: Group = {
    id: groupId,
    name: name.trim(),
    inviteCode,
    currency: currency || 'INR',
    createdAt: new Date().toISOString(),
  };

  await db.createGroup(group);

  // Add creator as ADMIN
  const member: GroupMember = {
    id: `mem_${Date.now()}`,
    flatId: groupId,
    groupId,
    userEmail: user.email,
    name: (user as any).name || user.email.split('@')[0],
    upiId: (user as any).upiId,
    role: 'ADMIN',
    joinedAt: new Date().toISOString(),
  };

  await db.addMember(member);

  return res.status(201).json({ group, flat: group, member });
});

// Join group by invite code
router.post('/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { inviteCode } = req.body;
  const user = req.user!;

  if (!inviteCode) {
    return res.status(400).json({ error: 'Invite code is required.' });
  }

  const db = getStorage();
  const group = await db.getGroupByInviteCode(inviteCode.trim());

  if (!group) {
    return res.status(404).json({ error: 'No group found with that invite code.' });
  }

  const member: GroupMember = {
    id: `mem_${Date.now()}`,
    flatId: group.id,
    groupId: group.id,
    userEmail: user.email,
    name: (user as any).name || user.email.split('@')[0],
    upiId: (user as any).upiId,
    role: 'MEMBER',
    joinedAt: new Date().toISOString(),
  };

  await db.addMember(member);

  return res.json({ group, flat: group, member, message: `Successfully joined ${group.name}!` });
});

// Get Group Info
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getStorage();
  const id = req.params.id as string;
  const group = await db.getGroupById(id);
  if (!group) return res.status(404).json({ error: 'Group not found.' });

  const members = await db.getMembers(group.id);
  return res.json({ group, flat: group, members });
});

// Get Group Members
router.get('/:id/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getStorage();
  const id = req.params.id as string;
  const members = await db.getMembers(id);
  return res.json({ members });
});

// Toggle Vacation / Away Mode
router.patch('/:id/members/away', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { isAway, awayUntil } = req.body;
  const user = req.user!;
  const db = getStorage();
  const id = req.params.id as string;

  const updated = await db.updateMemberAway(
    id,
    user.email,
    Boolean(isAway),
    awayUntil
  );

  return res.json({ success: updated, isAway: Boolean(isAway) });
});

// Toggle Group-Level Google Sheet Sync
router.patch('/:id/sync-settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { googleSheetSync } = req.body;
  const db = getStorage();
  const id = req.params.id as string;

  const updated = await db.updateGroupSync(id, Boolean(googleSheetSync));
  return res.json({ success: updated, googleSheetSync: Boolean(googleSheetSync) });
});

export default router;
