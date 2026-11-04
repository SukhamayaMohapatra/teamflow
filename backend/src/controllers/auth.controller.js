
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(128),
  role: z.enum(['ADMIN', 'DEVELOPER']),
});

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
});

// Login
export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid login details',
    });
  }

  const user = await User.findOne({
    email: parsed.data.email.toLowerCase(),
  }).select('+password');

  if (
    !user ||
    !user.isActive ||
    !(await bcrypt.compare(parsed.data.password, user.password))
  ) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const token = jwt.sign(
    {},
    process.env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      issuer: 'teamflow-api',
      audience: 'teamflow-web',
    }
  );

  res.cookie('accessToken', token, cookieOptions());

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// Logout
export const logout = (req, res) => {
  res.clearCookie('accessToken', {
    ...cookieOptions(),
    maxAge: undefined,
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

// Get currently authenticated user
export const me = (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

// Admin-only user creation (authorization is enforced in routes)
export const createUser = asyncHandler(async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user data',
      errors: parsed.error.issues,
    });
  }

  const { name, email, password, role } = parsed.data;

  // Check whether the email is already registered
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'A user with this email address already exists',
    });
  }

  // Hash password before storing it
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Handle duplicate email if another request creates it simultaneously
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    throw error;
  }
});
