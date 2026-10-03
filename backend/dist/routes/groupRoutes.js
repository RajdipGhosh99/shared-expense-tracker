import { Router } from 'express';
import { getStorage } from '../storage/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// Get all groups for authenticated user
router.get('/', authMiddleware, async (req, res) => {
    const user = req.user;
    const db = getStorage();
    const memberships = await db.getUserGroups(user.email);
    return res.json({
        memberships,
        groups: memberships.map((m) => m.group),
    });
});
// Create new group (Creator is automatically ADMIN & ACTIVE)
router.post('/', authMiddleware, async (req, res) => {
    const { name, currency } = req.body;
    const user = req.user;
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Group name is required.' });
    }
    const db = getStorage();
    const groupId = `group_${Date.now()}`;
    // Generate random 6-character uppercase invite code (e.g. GRP4X)
    const inviteCode = (name.replace(/[^A-Za-z]/g, '').slice(0, 3) + Math.random().toString(36).slice(2, 5)).toUpperCase();
    const group = {
        id: groupId,
        name: name.trim(),
        inviteCode,
        currency: currency || 'INR',
        createdAt: new Date().toISOString(),
    };
    await db.createGroup(group);
    // Add creator as ADMIN with ACTIVE status
    const member = {
        id: `mem_${Date.now()}`,
        groupId,
        flatId: groupId,
        userEmail: user.email.toLowerCase().trim(),
        name: user.name || user.email.split('@')[0],
        upiId: user.upiId,
        role: 'ADMIN',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
    };
    await db.addMember(member);
    return res.status(201).json({ group, flat: group, member });
});
// Join group by invite code (Requires Admin Approval unless first member)
router.post('/join', authMiddleware, async (req, res) => {
    const { inviteCode } = req.body;
    const user = req.user;
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
            message: existing.status === 'PENDING'
                ? 'Your join request is awaiting Admin approval.'
                : `You are already a member of ${group.name}!`,
        });
    }
    const existingMembers = await db.getMembers(group.id);
    const isFirstMember = existingMembers.length === 0;
    const member = {
        id: `mem_${Date.now()}`,
        groupId: group.id,
        flatId: group.id,
        userEmail: user.email.toLowerCase().trim(),
        name: user.name || user.email.split('@')[0],
        upiId: user.upiId,
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
        message: member.status === 'PENDING'
            ? `Join request submitted! Group Admin must approve your membership.`
            : `Successfully joined ${group.name}!`,
    });
});
// Get Group Info
router.get('/:id', authMiddleware, async (req, res) => {
    const db = getStorage();
    const id = req.params.id;
    const group = await db.getGroupById(id);
    if (!group)
        return res.status(404).json({ error: 'Group not found.' });
    const members = await db.getMembers(group.id);
    return res.json({ group, flat: group, members });
});
// Get Group Members
router.get('/:id/members', authMiddleware, async (req, res) => {
    const db = getStorage();
    const id = req.params.id;
    const members = await db.getMembers(id);
    return res.json({ members });
});
// Admin Approval for Pending Member
router.post('/:id/members/:email/approve', authMiddleware, async (req, res) => {
    const user = req.user;
    const groupId = req.params.id;
    const targetEmail = req.params.email;
    const db = getStorage();
    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only a group Admin can approve members.' });
    }
    const updated = await db.updateMemberStatus(groupId, targetEmail, 'ACTIVE');
    return res.json({ success: updated, message: `Approved member ${targetEmail}` });
});
// Admin Rejection for Pending Member
router.post('/:id/members/:email/reject', authMiddleware, async (req, res) => {
    const user = req.user;
    const groupId = req.params.id;
    const targetEmail = req.params.email;
    const db = getStorage();
    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only a group Admin can reject member requests.' });
    }
    const removed = await db.removeMember(groupId, targetEmail);
    return res.json({ success: removed, message: `Rejected join request for ${targetEmail}` });
});
// Admin Promote / Demote Member Role
router.patch('/:id/members/:email/role', authMiddleware, async (req, res) => {
    const user = req.user;
    const groupId = req.params.id;
    const targetEmail = req.params.email;
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
});
// Toggle Vacation / Away Mode
router.patch('/:id/members/away', authMiddleware, async (req, res) => {
    const { isAway, awayUntil } = req.body;
    const user = req.user;
    const db = getStorage();
    const id = req.params.id;
    const updated = await db.updateMemberAway(id, user.email, Boolean(isAway), awayUntil);
    return res.json({ success: updated, isAway: Boolean(isAway) });
});
// Toggle Group-Level Google Sheet Sync
router.patch('/:id/sync-settings', authMiddleware, async (req, res) => {
    const { googleSheetSync } = req.body;
    const db = getStorage();
    const id = req.params.id;
    const updated = await db.updateGroupSync(id, Boolean(googleSheetSync));
    return res.json({ success: updated, googleSheetSync: Boolean(googleSheetSync) });
});
// Update Group Expense Entry Form Controls (Admin Only)
router.patch('/:id/form-controls', authMiddleware, async (req, res) => {
    const user = req.user;
    const groupId = req.params.id;
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
router.post('/:id/invites', authMiddleware, async (req, res) => {
    const user = req.user;
    const groupId = req.params.id;
    const db = getStorage();
    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only a group Admin can create invites.' });
    }
    const inviteeName = req.body.invitee_name || req.body.inviteeName;
    const inviteeEmail = (req.body.invitee_email || req.body.inviteeEmail || '').toLowerCase().trim();
    const effectiveMoveInDate = req.body.effective_move_in_date ||
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
    const inviteCode = 'INV' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const invite = {
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
router.get('/:id/invites', authMiddleware, async (req, res) => {
    const user = req.user;
    const groupId = req.params.id;
    const db = getStorage();
    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only a group Admin can view invites.' });
    }
    const invites = await db.getGroupInvitesByGroup(groupId);
    return res.json({ invites });
});
// --- Tenancy: Admin Revoke Invite ---
router.delete('/:id/invites/:inviteId', authMiddleware, async (req, res) => {
    const user = req.user;
    const groupId = req.params.id;
    const inviteId = req.params.inviteId;
    const db = getStorage();
    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only a group Admin can revoke invites.' });
    }
    const updated = await db.updateGroupInviteStatus(inviteId, 'REVOKED');
    return res.json({ success: updated, message: 'Invite revoked.' });
});
// --- Tenancy: Admin Update Member Move-In / Move-Out Dates ---
router.patch('/:id/members/:email/tenancy', authMiddleware, async (req, res) => {
    const user = req.user;
    const groupId = req.params.id;
    const targetEmail = req.params.email;
    const db = getStorage();
    const caller = await db.getMember(groupId, user.email);
    if (!caller || caller.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only a group Admin can modify tenancy dates.' });
    }
    const member = await db.getMember(groupId, targetEmail);
    if (!member) {
        return res.status(404).json({ error: 'Member not found in this group.' });
    }
    const movedInAt = req.body.moved_in_at ||
        req.body.movedInAt ||
        member.movedInAt ||
        member.joinedAt.slice(0, 10);
    const movedOutAt = req.body.moved_out_at !== undefined
        ? req.body.moved_out_at
        : req.body.movedOutAt !== undefined
            ? req.body.movedOutAt
            : member.movedOutAt || null;
    const updated = await db.updateMemberTenancy(groupId, targetEmail, movedInAt.slice(0, 10), movedOutAt ? movedOutAt.slice(0, 10) : null);
    const updatedMember = await db.getMember(groupId, targetEmail);
    return res.json({
        success: updated,
        member: updatedMember,
        message: movedOutAt
            ? `Marked ${targetEmail} as vacated on ${movedOutAt}.`
            : `Updated tenancy dates for ${targetEmail}.`,
    });
});
// --- Tenancy: Dynamic Eligible Member Resolution ---
router.get('/:id/eligible-members', authMiddleware, async (req, res) => {
    const groupId = req.params.id;
    const db = getStorage();
    const dateQuery = req.query.date || new Date().toISOString().slice(0, 10);
    const eligibleMembers = await db.getEligibleMembers(groupId, dateQuery);
    const activeCount = eligibleMembers.filter((m) => m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE').length;
    return res.json({
        eligibleMembers,
        date: dateQuery,
        totalEligible: activeCount,
    });
});
export default router;
//# sourceMappingURL=groupRoutes.js.map