import { Router, Response } from 'express';
import { getStorage } from '../storage/index.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { Group, GroupMember, GroupInvite } from '@shared-expense-tracker/shared';

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

// DEPRECATED: Join group by 6-digit code (Decommissioned in favor of secure invite links)
router.post('/join', authMiddleware, async (_req: AuthRequest, res: Response) => {
  return res.status(410).json({
    error: '6-digit space codes have been decommissioned. Please join using an invite link from your space admin.',
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

// Admin Toggle Space Status (ACTIVE / INACTIVE)
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const groupId = req.params.id as string;
  const { status } = req.body;
  const db = getStorage();

  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (ACTIVE or INACTIVE) is required.' });
  }

  const caller = await db.getMember(groupId, user.email);
  if (!caller || caller.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only a group Admin can change space active status.' });
  }

  const updated = await db.updateGroupStatus(groupId, status);
  const updatedGroup = await db.getGroupById(groupId);
  return res.json({ success: updated, group: updatedGroup });
});

// Admin Delete Space (Permanently deletes space and all associated records)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const groupId = req.params.id as string;
  const { confirmName } = req.body;
  const db = getStorage();

  const group = await db.getGroupById(groupId);
  if (!group) return res.status(404).json({ error: 'Space not found.' });

  const caller = await db.getMember(groupId, user.email);
  if (!caller || caller.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only a group Admin can delete this space.' });
  }

  // Require confirmation typing of the exact group name
  if (!confirmName || confirmName.trim().toLowerCase() !== group.name.trim().toLowerCase()) {
    return res.status(400).json({
      error: `Please confirm deletion by typing the exact space name: "${group.name}".`,
    });
  }

  await db.deleteGroup(groupId);
  return res.json({ success: true, message: `Space "${group.name}" was permanently deleted.` });
});

// Get Group Members
router.get('/:id/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  const db = getStorage();
  const id = req.params.id as string;
  const members = await db.getMembers(id);
  return res.json({ members });
});

// Admin Remove Member (Automatically revokes any active space invites)
router.delete(
  '/:id/members/:email',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const groupId = req.params.id as string;
    const targetEmail = req.params.email as string;
    const db = getStorage();

    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only a group Admin can remove members.' });
    }

    if (caller.userEmail.toLowerCase() === targetEmail.toLowerCase()) {
      return res.status(400).json({ error: 'Admins cannot remove themselves. Transfer admin role first.' });
    }

    const removed = await db.removeMember(groupId, targetEmail);
    // Invalidate any pending or active invites for this member
    await db.revokeSpaceInvitesForMember(groupId, targetEmail);

    return res.json({ success: removed, message: `Removed member ${targetEmail} and revoked active invites.` });
  },
);

// Admin Approval for Pending Member (Decommissioned/Auto-approve)
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
    await db.revokeSpaceInvitesForMember(groupId, targetEmail);
    return res.json({ success: removed, message: `Rejected join request for ${targetEmail}` });
  },
);

// Admin Toggle Member Status (ACTIVE or INACTIVE)
router.patch(
  '/:id/members/:email/status',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const groupId = req.params.id as string;
    const targetEmail = req.params.email as string;
    const { status } = req.body;
    const db = getStorage();

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (ACTIVE or INACTIVE) is required.' });
    }

    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only a group Admin can change member active status.' });
    }

    const updated = await db.updateMemberStatus(groupId, targetEmail, status);
    const updatedMember = await db.getMember(groupId, targetEmail);
    return res.json({ success: updated, member: updatedMember });
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

// Update Group Expense Entry Form Controls (Admin Only)
router.patch('/:id/form-controls', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const groupId = req.params.id as string;
  const { formControls } = req.body;
  const db = getStorage();

  if (!formControls || typeof formControls !== 'object') {
    return res.status(400).json({ error: 'Valid formControls object is required.' });
  }

  const caller = await db.getMember(groupId, user.email);
  if (!caller || caller.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only a group Admin can customize entry form controls.' });
  }

  const updated = await db.updateGroupFormControls(groupId, formControls);
  const updatedGroup = await db.getGroupById(groupId);

  return res.json({
    success: updated,
    formControls: updatedGroup?.formControls,
    message: 'Group entry form controls updated successfully.',
  });
});

// --- Tenancy: Admin Create Personalized Invite with Move-In Date ---
router.post('/:id/invites', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const groupId = req.params.id as string;
  const db = getStorage();

  const caller = await db.getMember(groupId, user.email);
  if (!caller || caller.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only a group Admin can create invites.' });
  }

  const inviteeName = req.body.invitee_name || req.body.inviteeName;
  const inviteeEmail = (req.body.invitee_email || req.body.inviteeEmail || '').toLowerCase().trim();
  const effectiveMoveInDate =
    req.body.effective_move_in_date ||
    req.body.effectiveMoveInDate ||
    new Date().toISOString().slice(0, 10);

  if (!inviteeName || !inviteeEmail || !effectiveMoveInDate) {
    return res.status(400).json({
      error: 'invitee_name, invitee_email, and effective_move_in_date are required.',
    });
  }

  // Check if member is already in group
  const existingMember = await db.getMember(groupId, inviteeEmail);
  if (existingMember && existingMember.status !== 'LEFT') {
    return res.status(409).json({ error: 'This user is already a member of this group.' });
  }

  const inviteCode =
    'INV' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const invite: GroupInvite = {
    id: `inv_${Date.now()}`,
    groupId,
    inviteCode,
    inviteeName: inviteeName.trim(),
    inviteeEmail,
    effectiveMoveInDate: effectiveMoveInDate.slice(0, 10),
    createdBy: user.email,
    status: 'PENDING',
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  await db.createGroupInvite(invite);

  return res.status(201).json({
    invite,
    joinLink: `/join?invite=${invite.inviteCode}`,
    inviteCode: invite.inviteCode,
  });
});

// --- Tenancy: Admin List Invites ---
router.get('/:id/invites', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const groupId = req.params.id as string;
  const db = getStorage();

  const caller = await db.getMember(groupId, user.email);
  if (!caller || caller.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only a group Admin can view invites.' });
  }

  const invites = await db.getGroupInvitesByGroup(groupId);
  return res.json({ invites });
});

// --- Tenancy: Admin Revoke Invite ---
router.delete('/:id/invites/:inviteId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const groupId = req.params.id as string;
  const inviteId = req.params.inviteId as string;
  const db = getStorage();

  const caller = await db.getMember(groupId, user.email);
  if (!caller || caller.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only a group Admin can revoke invites.' });
  }

  const updated = await db.updateGroupInviteStatus(inviteId, 'REVOKED');
  return res.json({ success: updated, message: 'Invite revoked.' });
});

// --- Tenancy: Admin Update Member Move-In / Move-Out Dates ---
router.patch(
  '/:id/members/:email/tenancy',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const groupId = req.params.id as string;
    const targetEmail = req.params.email as string;
    const db = getStorage();

    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only a group Admin can modify tenancy dates.' });
    }

    const member = await db.getMember(groupId, targetEmail);
    if (!member) {
      return res.status(404).json({ error: 'Member not found in this group.' });
    }

    const movedInAt =
      req.body.moved_in_at ||
      req.body.movedInAt ||
      member.movedInAt ||
      member.joinedAt.slice(0, 10);
    const movedOutAt =
      req.body.moved_out_at !== undefined
        ? req.body.moved_out_at
        : req.body.movedOutAt !== undefined
          ? req.body.movedOutAt
          : member.movedOutAt || null;

    const updated = await db.updateMemberTenancy(
      groupId,
      targetEmail,
      movedInAt.slice(0, 10),
      movedOutAt ? movedOutAt.slice(0, 10) : null,
    );

    const updatedMember = await db.getMember(groupId, targetEmail);
    return res.json({
      success: updated,
      member: updatedMember,
      message: movedOutAt
        ? `Marked ${targetEmail} as vacated on ${movedOutAt}.`
        : `Updated tenancy dates for ${targetEmail}.`,
    });
  },
);

// --- Tenancy: Dynamic Eligible Member Resolution ---
router.get('/:id/eligible-members', authMiddleware, async (req: AuthRequest, res: Response) => {
  const groupId = req.params.id as string;
  const db = getStorage();
  const dateQuery = (req.query.date as string) || new Date().toISOString().slice(0, 10);

  const eligibleMembers = await db.getEligibleMembers(groupId, dateQuery);
  const activeCount = eligibleMembers.filter(
    (m) => m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE',
  ).length;

  return res.json({
    eligibleMembers,
    date: dateQuery,
    totalEligible: activeCount,
  });
});

export default router;
