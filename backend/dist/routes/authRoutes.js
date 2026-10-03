import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getStorage } from '../storage/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// User auth routes with real database persistence and bcrypt verification
router.post('/register', async (req, res) => {
    const { email, password, name, upiId } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const storage = getStorage();
    const existing = await storage.getUserByEmail(cleanEmail);
    if (existing) {
        return res
            .status(409)
            .json({ error: 'An account with this email already exists. Please log in.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userRecord = await storage.createUser({
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        email: cleanEmail,
        passwordHash,
        name: name.trim(),
        upiId: upiId ? upiId.trim() : undefined,
    });
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';
    const token = jwt.sign({ email: userRecord.email, name: userRecord.name, upiId: userRecord.upiId || '' }, secret, { expiresIn: '30d' });
    return res.status(201).json({
        token,
        user: { email: userRecord.email, name: userRecord.name, upiId: userRecord.upiId || '' },
    });
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const storage = getStorage();
    const user = await storage.getUserByEmail(cleanEmail);
    if (!user) {
        return res.status(401).json({
            error: 'No account found with this email. Please sign up to create an account.',
        });
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return res.status(401).json({
            error: 'Incorrect password. Please try again.',
        });
    }
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_84920491';
    const token = jwt.sign({ email: user.email, name: user.name, upiId: user.upiId || '' }, secret, { expiresIn: '30d' });
    return res.json({
        token,
        user: { email: user.email, name: user.name, upiId: user.upiId || '' },
    });
});
router.post('/google', async (req, res) => {
    const { email, name, avatar, upiId } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Google email is required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const userName = name?.trim() ||
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
router.get('/me', authMiddleware, (req, res) => {
    return res.json({ user: req.user });
});
export default router;
//# sourceMappingURL=authRoutes.js.map