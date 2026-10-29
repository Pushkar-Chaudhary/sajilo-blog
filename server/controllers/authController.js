import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/config.js';
import { AppError } from '../middleware/errorHandler.js';

function signToken(userId) {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function sendTokenResponse(user, statusCode, res) {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    secure: config.nodeEnv === 'production',
  };

  res.cookie('token', token, cookieOptions);
  res.status(statusCode).json({
    success: true,
    user: user.toJSON(),
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Name, email, and password are required', 400));
    }
    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return next(new AppError('An account with this email already exists', 409));
    }

    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (user.status === 'suspended') {
      return next(new AppError('Your account has been suspended', 403));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    secure: config.nodeEnv === 'production',
  });
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getMe(req, res) {
  res.json({ success: true, user: req.user.toJSON() });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, bio, website, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim().slice(0, 80);
    if (bio !== undefined) updates.bio = bio.trim().slice(0, 500);
    if (website !== undefined) updates.website = website.trim().slice(0, 200);
    if (avatar !== undefined) updates.avatar = avatar.trim().slice(0, 500);

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new AppError('Current and new passwords are required', 400));
    }
    if (newPassword.length < 8) {
      return next(new AppError('New password must be at least 8 characters', 400));
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 401));
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}
