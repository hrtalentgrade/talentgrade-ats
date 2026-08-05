import jwt from 'jsonwebtoken';
import { run } from '../db.js';

export const JWT_SECRET = 'talentgrade_secret_key_2026_rop';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid or expired' });
    }
    req.user = user;
    next();
  });
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role' });
    }
    next();
  };
};

export const logActivity = async (userId, action, details, ipAddress = '') => {
  try {
    await run(`
      INSERT INTO activity_logs (user_id, action, details, ip_address)
      VALUES (?, ?, ?, ?)
    `, [userId, action, details, ipAddress]);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

export const createNotification = async (userId, title, message) => {
  try {
    await run(`
      INSERT INTO notifications (user_id, title, message, is_read)
      VALUES (?, ?, ?, 0)
    `, [userId, title, message]);
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};
