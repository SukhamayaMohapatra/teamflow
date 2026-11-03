import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({ isActive: true }).select('name email role createdAt').sort({ name: 1 }).limit(200);
  res.json({ success: true, data: users });
});
