import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getStorage } from '../storage/index.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// In-memory / Turso user auth helper
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name, upiId } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';

  // Generate JWT token
  const token = jwt.sign(
    { email: cleanEmail, name, upiId: upiId || '' },
    secret,
    { expiresIn: '30d' }
  );

  return res.status(201).json({
    token,
    user: { email: cleanEmail, name, upiId: upiId || '' },
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';

  // For rapid prototype/onboarding, allow simple login or verify password
  const name = cleanEmail.split('@')[0];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  const token = jwt.sign(
    { email: cleanEmail, name: capitalized },
    secret,
    { expiresIn: '30d' }
  );

  return res.json({
    token,
    user: { email: cleanEmail, name: capitalized },
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
