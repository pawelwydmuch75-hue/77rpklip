import { Router } from 'express';
import { register, login, getMe, discordLogin, getDiscordAuthUrl } from '../controllers/auth.controller';
import { updateProfile, removeAvatar, removeBanner } from '../controllers/profile.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadProfileImages } from '../middleware/upload.middleware';

const router = Router();

// Auth
router.post('/register', register);
router.post('/login', login);
router.post('/discord', discordLogin);
router.get('/discord/url', getDiscordAuthUrl);
router.get('/me', authenticateToken, getMe);

// Profil
router.patch('/profile', authenticateToken, uploadProfileImages, updateProfile);
router.delete('/avatar', authenticateToken, removeAvatar);
router.delete('/banner', authenticateToken, removeBanner);

export default router;
