import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AuthRequest } from '../middleware/auth.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
  return { accessToken, refreshToken };
};

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation failed', errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { name, email, password } = validation.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
    });

    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation failed', errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
};

export const googleAuth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ message: 'Google credential required' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ message: 'Invalid Google token' });
      return;
    }

    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: payload.email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.avatar = payload.picture || user.avatar;
        await user.save();
      }
    } else {
      user = await User.create({
        name: payload.name || 'Google User',
        email: payload.email,
        googleId: payload.sub,
        avatar: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || 'G')}&background=6366f1&color=fff`,
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ message: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const tokens = generateTokens(user._id.toString());
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { name, avatar } = req.body;
    const updates: any = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'Invalid password data' });
      return;
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !user.password) {
      res.status(400).json({ message: 'Cannot change password for OAuth accounts' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password' });
  }
};
