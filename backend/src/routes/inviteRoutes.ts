import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getStorage } from '../storage/index.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { emailService } from '../services/emailService.js';
import { SpaceInvite, GroupMember } from '@shared-expense-tracker/shared';

const router = Router();

// In-memory rate limiting map for IP & invite level protection: key -> timestamp
const otpRequestCooldowns = new Map<string, number>();

/**
 * Helper to compute SHA-256 hex digest of raw token string
 */
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * POST /api/spaces/:spaceId/invites
 * (Also mounted as POST /api/groups/:spaceId/invites)
 * Admin generation of persistent, passwordless invite links
 */
router.post(['/spaces/:spaceId/invites', '/groups/:spaceId/invites'], authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const spaceId = req.params.spaceId as string;
  const { email, name } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const db = getStorage();

  const caller = await db.getMember(spaceId, user.email);
  if (!caller || caller.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only a space Admin can generate invite links.' });
  }

  const space = await db.getGroupById(spaceId);
  if (!space) {
    return res.status(404).json({ error: 'Space not found.' });
  }

  const existingMember = await db.getMember(spaceId, cleanEmail);
  if (existingMember && existingMember.status === 'ACTIVE') {
    return res.status(409).json({ error: `${cleanEmail} is already an active member of ${space.name}.` });
  }

  // Revoke any previous pending invite for this space & email to prevent duplicate active links
  await db.revokeSpaceInvitesForMember(spaceId, cleanEmail);

  // Generate 256-bit cryptographically secure raw token
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);

  const invite: SpaceInvite = {
    id: `spcinv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    spaceId,
    tokenHash,
    invitedEmail: cleanEmail,
    suggestedName: name ? String(name).trim() : undefined,
    createdBy: user.email.toLowerCase().trim(),
    status: 'PENDING_ACCEPTANCE',
    createdAt: new Date().toISOString(),
  };

  await db.createSpaceInvite(invite);

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'bhagabhagi.vercel.app';
  const joinUrl = `${protocol}://${host}/join?t=${rawToken}`;

  return res.status(201).json({
    success: true,
    inviteId: invite.id,
    inviteUrl: joinUrl,
    rawToken,
    invitedEmail: cleanEmail,
    suggestedName: invite.suggestedName,
    spaceName: space.name,
    status: invite.status,
  });
});

/**
 * GET /api/invites/validate?token=<raw_token>
 * Public validation of invite token.
 * SECURITY: Returns ONLY spaceName and suggestedName. Never returns the invitedEmail!
 */
router.get('/validate', async (req: Request, res: Response) => {
  const rawToken = req.query.token as string || req.query.t as string;

  if (!rawToken || typeof rawToken !== 'string') {
    return res.status(400).json({ error: 'Invite token is required.' });
  }

  const db = getStorage();
  const tokenHash = hashToken(rawToken);
  const invite = await db.getSpaceInviteByTokenHash(tokenHash);

  if (!invite) {
    return res.status(404).json({ error: 'Invalid or expired invite link.' });
  }

  if (invite.status === 'REVOKED') {
    return res.status(410).json({ error: 'This invite link has been revoked by the space admin.' });
  }

  const space = await db.getGroupById(invite.spaceId);
  if (!space) {
    return res.status(404).json({ error: 'The space for this invite no longer exists.' });
  }

  return res.json({
    valid: true,
    status: invite.status,
    spaceId: space.id,
    spaceName: space.name,
    suggestedName: invite.suggestedName || '',
    currency: space.currency || 'INR',
  });
});

/**
 * POST /api/invites/send-otp
 * Public OTP dispatch to the email locked inside the invite token record.
 * SECURITY: User does not pass an email; backend reads invitedEmail bound to tokenHash.
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invite token is required.' });
  }

  const db = getStorage();
  const tokenHash = hashToken(token);
  const invite = await db.getSpaceInviteByTokenHash(tokenHash);

  if (!invite) {
    return res.status(404).json({ error: 'Invalid invite link.' });
  }

  if (invite.status === 'REVOKED') {
    return res.status(410).json({ error: 'This invite link has been revoked by the space admin.' });
  }

  if (invite.status === 'ACTIVE') {
    return res.status(400).json({ error: 'This invite has already been accepted.' });
  }

  const space = await db.getGroupById(invite.spaceId);
  if (!space) {
    return res.status(404).json({ error: 'The space for this invite no longer exists.' });
  }

  // Rate Limiting: 60-second cooldown per invite ID
  const now = Date.now();
  const lastCooldown = otpRequestCooldowns.get(invite.id) || 0;
  if (now - lastCooldown < 60000) {
    const remainingSeconds = Math.ceil((60000 - (now - lastCooldown)) / 1000);
    return res.status(429).json({
      error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
      retryAfterSeconds: remainingSeconds,
    });
  }

  // Generate secure 6-digit numeric OTP
  const rawOtp = String(crypto.randomInt(100000, 1000000));
  const otpHash = await bcrypt.hash(rawOtp, 10);
  const expiresAt = new Date(now + 5 * 60 * 1000).toISOString(); // 5 minutes

  await db.saveInviteOtp({
    id: `otp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    inviteId: invite.id,
    otpHash,
    attemptsLeft: 5,
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  await db.updateSpaceInviteLastOtpSent(invite.id, new Date().toISOString());
  otpRequestCooldowns.set(invite.id, now);

  // Send branded email to the locked recipient
  const emailSent = await emailService.sendInviteOtp(
    invite.invitedEmail,
    rawOtp,
    space.name,
    invite.suggestedName,
  );

  if (!emailSent) {
    return res.status(500).json({ error: 'Failed to dispatch verification email. Please try again later.' });
  }

  return res.json({
    success: true,
    message: 'Verification code sent to your registered email address.',
    cooldownSeconds: 60,
    expiresInMinutes: 5,
  });
});

/**
 * POST /api/invites/accept
 * Verifies OTP, upserts user, establishes ACTIVE membership, and issues 30d JWT session.
 */
router.post('/accept', async (req: Request, res: Response) => {
  const { token, otp, displayName, upiId } = req.body;

  if (!token || !otp) {
    return res.status(400).json({ error: 'Invite token and 6-digit verification code are required.' });
  }

  const db = getStorage();
  const tokenHash = hashToken(String(token));
  const invite = await db.getSpaceInviteByTokenHash(tokenHash);

  if (!invite) {
    return res.status(404).json({ error: 'Invalid invite link.' });
  }

  if (invite.status === 'REVOKED') {
    return res.status(410).json({ error: 'This invite link has been revoked by the space admin.' });
  }

  const space = await db.getGroupById(invite.spaceId);
  if (!space) {
    return res.status(404).json({ error: 'The space for this invite no longer exists.' });
  }

  const activeOtp = await db.getActiveInviteOtp(invite.id);
  if (!activeOtp) {
    return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
  }

  if (activeOtp.attemptsLeft <= 0) {
    return res.status(403).json({ error: 'Too many incorrect attempts. Please request a new verification code.' });
  }

  // Verify OTP
  const isMatch = await bcrypt.compare(String(otp).trim(), activeOtp.otpHash);
  if (!isMatch) {
    const remaining = await db.decrementOtpAttempts(activeOtp.id);
    return res.status(400).json({
      error: remaining > 0
        ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
        : 'Maximum attempts exceeded. Please request a new verification code.',
      attemptsLeft: remaining,
    });
  }

  // OTP verified! Invalidate OTPs for this invite
  await db.deleteInviteOtps(invite.id);

  // 1. User Upsert (Passwordless: if user doesn't exist, create account with random secure hash)
  const userEmail = invite.invitedEmail.toLowerCase().trim();
  let userRecord = await db.getUserByEmail(userEmail);
  const finalName = displayName?.trim() || invite.suggestedName || userEmail.split('@')[0];
  const finalUpi = upiId ? String(upiId).trim() : userRecord?.upiId;

  if (!userRecord) {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    userRecord = await db.createUser({
      id: `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      email: userEmail,
      passwordHash,
      name: finalName,
      upiId: finalUpi,
    });
  }

  // 2. Add / Update Group Membership (Always ACTIVE)
  const existingMember = await db.getMember(space.id, userEmail);
  const member: GroupMember = {
    id: existingMember?.id || `mem_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    groupId: space.id,
    flatId: space.id,
    userEmail,
    name: finalName,
    upiId: finalUpi,
    role: existingMember?.role || 'MEMBER',
    status: 'ACTIVE',
    joinedAt: existingMember?.joinedAt || new Date().toISOString(),
    movedInAt: new Date().toISOString().slice(0, 10),
  };

  await db.addMember(member);

  // 3. Update invite status to ACTIVE
  await db.updateSpaceInviteStatus(invite.id, 'ACTIVE', new Date().toISOString());

  // 4. Issue 30-day session JWT
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';
  const sessionToken = jwt.sign(
    { email: userRecord.email, name: finalName, upiId: finalUpi || '' },
    secret,
    { expiresIn: '30d' },
  );

  return res.json({
    success: true,
    token: sessionToken,
    user: { email: userRecord.email, name: finalName, upiId: finalUpi || '' },
    space: { id: space.id, name: space.name, currency: space.currency || 'INR' },
    member,
    message: `Welcome to ${space.name}!`,
  });
});

export default router;
