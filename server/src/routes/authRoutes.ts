import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  register,
  login,
  googleAuth,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

export default router;
