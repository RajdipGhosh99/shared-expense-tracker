import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getStorage } from '../storage/index.js';

export interface AuthRequest extends Request {
  user?: {
    email: string;
    flatId?: string;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';
    const decoded = jwt.verify(token, secret) as any;
    if (!decoded || !decoded.email) {
      res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
      return;
    }

    // Verify user still exists in the database (handles DB wipes, account deletions)
    const storage = getStorage();
    const dbUser = await storage.getUserByEmail(decoded.email.toLowerCase().trim());
    if (!dbUser) {
      res.status(401).json({ error: 'Unauthorized: User account no longer exists in database' });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
}
