import { Router } from 'express';
import { getStorage } from '../storage/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// Accept Invite Token / Code
router.post('/accept', authMiddleware, async (req, res) => {
    const user = req.user;
    const inviteCode = req.body.invite_code || req.body.inviteCode;
    if (!inviteCode) {
        return res.status(400).json({ error: 'Invite code is required.' });
    }
    const db = getStorage();
    const invite = await db.getGroupInviteByCode(String(inviteCode).trim());
    if (!invite) {
        return res.status(404).json({ error: 'No invite found with this code.' });
    }
    if (invite.status !== 'PENDING') {
        return res.status(400).json({ error: `Invite is already ${invite.status.toLowerCase()}.` });
    }
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
        await db.updateGroupInviteStatus(invite.id, 'EXPIRED');
        return res.status(400).json({ error: 'This invite has expired.' });
    }
    const group = await db.getGroupById(invite.groupId);
    if (!group) {
        return res.status(404).json({ error: 'The group for this invite no longer exists.' });
    }
    const existingMember = await db.getMember(invite.groupId, user.email);
    if (existingMember && existingMember.status === 'ACTIVE') {
        await db.updateGroupInviteStatus(invite.id, 'ACCEPTED');
        return res.json({
            success: true,
            group,
            flat: group,
            member: existingMember,
            message: `You are already an active member of ${group.name}!`,
        });
    }
    const member = {
        id: existingMember?.id || `mem_${Date.now()}`,
        groupId: invite.groupId,
        flatId: invite.groupId,
        userEmail: user.email.toLowerCase().trim(),
        name: user.name || invite.inviteeName,
        upiId: user.upiId,
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
        movedInAt: invite.effectiveMoveInDate,
        movedOutAt: undefined,
    };
    await db.addMember(member);
    await db.updateGroupInviteStatus(invite.id, 'ACCEPTED');
    return res.json({
        success: true,
        group,
        flat: group,
        member,
        message: `Successfully accepted invite and joined ${group.name}! Liabilities start from ${invite.effectiveMoveInDate}.`,
    });
});
// Inspect Invite Code
router.get('/:code', async (req, res) => {
    const code = req.params.code;
    const db = getStorage();
    const invite = await db.getGroupInviteByCode(code);
    if (!invite) {
        return res.status(404).json({ error: 'Invite not found.' });
    }
    const group = await db.getGroupById(invite.groupId);
    return res.json({
        invite: {
            id: invite.id,
            inviteCode: invite.inviteCode,
            inviteeName: invite.inviteeName,
            inviteeEmail: invite.inviteeEmail,
            effectiveMoveInDate: invite.effectiveMoveInDate,
            status: invite.status,
            expiresAt: invite.expiresAt,
        },
        groupName: group?.name || 'Shared Flat',
        currency: group?.currency || 'INR',
    });
});
export default router;
//# sourceMappingURL=inviteRoutes.js.map