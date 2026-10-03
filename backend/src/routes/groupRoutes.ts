import { Router, Response } from 'express';
import { getStorage } from '../storage/index.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { Group, GroupMember } from '@shared-expense-tracker/shared';

const router = Router();

// Get all groups for authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const db = getStorage();
  const memberships = await db.getUserGroups(user.email);
  return res.json({
    memberships,
    groups: memberships.map((m: any) => m.group),
  });
});

// Create new group (Creator is automatically ADMIN & ACTIVE)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, currency } = req.body;
  const user = req.user!;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Group name is required.' });
  }

  const db = getStorage();
  const groupId = `group_${Date.now()}`;
  // Generate random 6-character uppercase invite code (e.g. GRP4X)
  const inviteCode = (
    name.replace(/[^A-Za-z]/g, '').slice(0, 3) + Math.random().toString(36).slice(2, 5)
  ).toUpperCase();

  const group: Group = {
    id: groupId,
    name: name.trim(),
    inviteCode,
    currency: currency || 'INR',
    createdAt: new Date().toISOString(),
  };

  await db.createGroup(group);

  // Add creator as ADMIN with ACTIVE status
  const member: GroupMember = {
    id: `mem_${Date.now()}`,
    groupId,
    flatId: groupId,
    userEmail: user.email.toLowerCase().trim(),
    name: (user as any).name || user.email.split('@')[0],
    upiId: (user as any).upiId,
    role: 'ADMIN',
    status: 'ACTIVE',
    joinedAt: new Date().toISOString(),
  };

  await db.addMember(member);

  return res.status(201).json({ group, flat: group, member });
});

// Join group by invite code (Requires Admin Approval unless first member)
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

  const existing = await db.getMember(group.id, user.email);
  if (existing) {
    return res.json({
      group,
      flat: group,
      member: existing,
      status: existing.status,
      pendingApproval: existing.status === 'PENDING',
      message:
        existing.status === 'PENDING'
          ? 'Your join request is awaiting Admin approval.'
          : `You are already a member of ${group.name}!`,
    });
  }

  const existingMembers = await db.getMembers(group.id);
  const isFirstMember = existingMembers.length === 0;

  const member: GroupMember = {
    id: `mem_${Date.now()}`,
    groupId: group.id,
    flatId: group.id,
    userEmail: user.email.toLowerCase().trim(),
    name: (user as any).name || user.email.split('@')[0],
    upiId: (user as any).upiId,
    role: isFirstMember ? 'ADMIN' : 'MEMBER',
    status: isFirstMember ? 'ACTIVE' : 'PENDING',
    joinedAt: new Date().toISOString(),
  };

  await db.addMember(member);

  return res.json({
    group,
    flat: group,
    member,
    pendingApproval: member.status === 'PENDING',
    message:
      member.status === 'PENDING'
        ? `Join request submitted! Group Admin must approve your membership.`
        : `Successfully joined ${group.name}!`,
  });
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

// Admin Approval for Pending Member
router.post(
  '/:id/members/:email/approve',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const groupId = req.params.id as string;
    const targetEmail = req.params.email as string;
    const db = getStorage();

    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only a group Admin can approve members.' });
    }

    const updated = await db.updateMemberStatus(groupId, targetEmail, 'ACTIVE');
    return res.json({ success: updated, message: `Approved member ${targetEmail}` });
  },
);

// Admin Rejection for Pending Member
router.post(
  '/:id/members/:email/reject',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const groupId = req.params.id as string;
    const targetEmail = req.params.email as string;
    const db = getStorage();

    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only a group Admin can reject member requests.' });
    }

    const removed = await db.removeMember(groupId, targetEmail);
    return res.json({ success: removed, message: `Rejected join request for ${targetEmail}` });
  },
);

// Admin Promote / Demote Member Role
router.patch(
  '/:id/members/:email/role',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const groupId = req.params.id as string;
    const targetEmail = req.params.email as string;
    const { role } = req.body;
    const db = getStorage();

    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Valid role (ADMIN or MEMBER) is required.' });
    }

    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only a group Admin can change member roles.' });
    }

    const updated = await db.updateMemberRole(groupId, targetEmail, role);
    return res.json({ success: updated, role });
  },
);

// Toggle Vacation / Away Mode
router.patch('/:id/members/away', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { isAway, awayUntil } = req.body;
  const user = req.user!;
  const db = getStorage();
  const id = req.params.id as string;

  const updated = await db.updateMemberAway(id, user.email, Boolean(isAway), awayUntil);

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
