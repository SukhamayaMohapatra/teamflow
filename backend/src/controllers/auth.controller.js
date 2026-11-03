import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.COOKIE_SAME_SITE || 'lax', path: '/', maxAge: 24 * 60 * 60 * 1000 });
export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid login details' });
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+password');
  if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || '1d', issuer: 'teamflow-api', audience: 'teamflow-web' });
  res.cookie('accessToken', token, cookieOptions());
  res.json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
});
export const logout = (req, res) => { res.clearCookie('accessToken', { ...cookieOptions(), maxAge: undefined }); res.json({ success: true }); };
export const me = (req, res) => res.json({ success: true, data: { user: req.user } });
export const createUser = asyncHandler(async (req, res) => {
  const schema = z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(12).max(128), role: z.enum(['ADMIN','DEVELOPER']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid user data', errors: parsed.error.issues });
  const password = await bcrypt.hash(parsed.data.password, 12);
  const user = await User.create({ ...parsed.data, password });
  res.status(201).json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
