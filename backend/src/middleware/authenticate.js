import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.accessToken || req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email role isActive');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Account unavailable' });
    req.user = user;
    next();
  } catch { res.status(401).json({ success: false, message: 'Invalid or expired session' }); }
}
