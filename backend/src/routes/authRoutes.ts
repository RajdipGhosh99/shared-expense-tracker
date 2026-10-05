import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getStorage } from '../storage/index.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// User auth routes with real database persistence and bcrypt verification
import crypto from 'crypto';
import { emailService } from '../services/emailService.js';

// Cooldown tracker for login OTP requests: email -> timestamp
const loginOtpCooldowns = new Map<string, number>();

/**
 * POST /api/auth/send-otp
 * Passwordless: send 6-digit OTP to user email
 * Body: { email, name?, mode?: 'login' | 'signup' }
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  const { email, name, mode } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const storage = getStorage();
  const existingUser = await storage.getUserByEmail(cleanEmail);

  // If user is attempting to sign up, but account already exists:
  if (mode === 'signup' && existingUser) {
    return res.status(409).json({
      error: 'An account with this email already exists. Please switch to Log In.',
      isExistingUser: true,
    });
  }

  // If user is attempting to log in, but no account exists:
  if (mode === 'login' && !existingUser) {
    return res.status(404).json({
      error: 'No account found with this email. Please switch to Sign Up.',
      isExistingUser: false,
    });
  }

  const now = Date.now();
  const lastSent = loginOtpCooldowns.get(cleanEmail) || 0;
  if (now - lastSent < 60000) {
    const remaining = Math.ceil((60000 - (now - lastSent)) / 1000);
    return res.status(429).json({
      error: `Please wait ${remaining} seconds before requesting a new code.`,
      retryAfterSeconds: remaining,
    });
  }

  // Generate 6-digit numeric OTP
  const rawOtp = String(crypto.randomInt(100000, 1000000));
  const otpHash = await bcrypt.hash(rawOtp, 10);
  const expiresAt = new Date(now + 10 * 60 * 1000).toISOString(); // 10 minutes

  await storage.saveUserOtp({
    id: `uotp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    email: cleanEmail,
    otpHash,
    attemptsLeft: 5,
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  loginOtpCooldowns.set(cleanEmail, now);

  const recipientName = existingUser?.name || name || undefined;
  const sent = await emailService.sendLoginOtp(cleanEmail, rawOtp, recipientName);
  if (!sent) {
    return res.status(500).json({ error: 'Failed to send login code. Please check email address.' });
  }

  return res.json({
    success: true,
    message: mode === 'signup' ? 'Verification code sent. Verify your email to complete signup.' : 'Verification code sent to your email.',
    isExistingUser: !!existingUser,
    cooldownSeconds: 60,
  });
});

/**
 * POST /api/auth/verify-otp
 * Passwordless: verify OTP and issue JWT.
 * When signing up, requires verified email OTP before creating the user.
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { email, otp, name, upiId, mode } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanOtp = String(otp).trim();
  const storage = getStorage();

  const activeOtp = await storage.getActiveUserOtp(cleanEmail);
  if (!activeOtp) {
    return res.status(400).json({ error: 'No active code found. Please request a new code.' });
  }

  if (activeOtp.attemptsLeft <= 0) {
    await storage.deleteUserOtps(cleanEmail);
    return res.status(429).json({ error: 'Too many invalid attempts. Please request a new code.' });
  }

  const isValid = await bcrypt.compare(cleanOtp, activeOtp.otpHash);
  if (!isValid) {
    const remaining = await storage.decrementUserOtpAttempts(activeOtp.id);
    return res.status(400).json({
      error: remaining > 0 ? `Incorrect code. ${remaining} attempt(s) remaining.` : 'Incorrect code. Please request a new one.',
    });
  }

  // OTP verified successfully -> clear OTP record
  await storage.deleteUserOtps(cleanEmail);

  // Email is now officially verified! Check / provision user
  let userRecord = await storage.getUserByEmail(cleanEmail);
  if (!userRecord) {
    const fallbackName = name?.trim() || cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1);
    const dummyHash = await bcrypt.hash('otp_verified_' + Date.now(), 10);
    userRecord = await storage.createUser({
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: cleanEmail,
      passwordHash: dummyHash,
      name: fallbackName,
      upiId: upiId ? upiId.trim() : undefined,
    });
  } else if (name?.trim() || upiId) {
    // Update user details if provided
    await storage.createUser({
      id: userRecord.id,
      email: cleanEmail,
      passwordHash: userRecord.passwordHash,
      name: name?.trim() || userRecord.name,
      upiId: upiId ? upiId.trim() : userRecord.upiId,
    });
    userRecord = (await storage.getUserByEmail(cleanEmail))!;
  }

  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';
  const token = jwt.sign(
    { email: userRecord.email, name: userRecord.name, upiId: userRecord.upiId || '' },
    secret,
    { expiresIn: '30d' },
  );

  return res.json({
    token,
    user: { email: userRecord.email, name: userRecord.name, upiId: userRecord.upiId || '' },
    message: mode === 'signup' ? 'Email verified! Account created successfully.' : 'Logged in successfully.',
  });
});

// Legacy register & password login routes kept for backward compatibility if called
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name, upiId } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const storage = getStorage();
  const existing = await storage.getUserByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const passwordHash = await bcrypt.hash(password || 'nopass_' + Date.now(), 10);
  const userRecord = await storage.createUser({
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    email: cleanEmail,
    passwordHash,
    name: name.trim(),
    upiId: upiId ? upiId.trim() : undefined,
  });

  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';
  const token = jwt.sign(
    { email: userRecord.email, name: userRecord.name, upiId: userRecord.upiId || '' },
    secret,
    { expiresIn: '30d' },
  );

  return res.status(201).json({
    token,
    user: { email: userRecord.email, name: userRecord.name, upiId: userRecord.upiId || '' },
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const storage = getStorage();
  const user = await storage.getUserByEmail(cleanEmail);
  if (!user) {
    return res.status(401).json({ error: 'No account found with this email.' });
  }

  if (password) {
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
  }

  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';
  const token = jwt.sign(
    { email: user.email, name: user.name, upiId: user.upiId || '' },
    secret,
    { expiresIn: '30d' },
  );

  return res.json({
    token,
    user: { email: user.email, name: user.name, upiId: user.upiId || '' },
  });
});

router.post('/google', async (req: Request, res: Response) => {
  const { email, name, avatar, upiId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Google email is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const userName =
    name?.trim() ||
    cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1);
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';

  // Ensure user account exists in DB for Google users
  const storage = getStorage();
  let userRecord = await storage.getUserByEmail(cleanEmail);
  if (!userRecord) {
    const dummyHash = await bcrypt.hash('oauth_google_' + Date.now(), 10);
    userRecord = await storage.createUser({
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: cleanEmail,
      passwordHash: dummyHash,
      name: userName,
      upiId: upiId ? upiId.trim() : undefined,
    });
  }

  const user = {
    email: cleanEmail,
    name: userName,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
    upiId: upiId || '',
  };

  const token = jwt.sign(user, secret, { expiresIn: '30d' });

  return res.json({
    token,
    user,
  });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ error: 'Unauthorized' });

  const storage = getStorage();
  const dbUser = await storage.getUserByEmail(email);
  if (!dbUser) {
    return res.status(401).json({ error: 'User account no longer exists in database.' });
  }

  return res.json({ user: { email: dbUser.email, name: dbUser.name, upiId: dbUser.upiId || '' } });
});

export default router;
