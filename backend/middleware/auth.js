const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'ghana-pass-jwt-secret-key-2024';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function auditLog(req, action, resource, resourceId, details) {
  const { v4: uuidv4 } = require('uuid');
  try {
    db.prepare(`INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
      .run(uuidv4(), req.user?.id || null, action, resource, resourceId, 
        typeof details === 'object' ? JSON.stringify(details) : details,
        req.ip, req.headers['user-agent']);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

function generateTokens(user) {
  const payload = {
    id: user.id,
    ghana_card_number: user.ghana_card_number,
    full_name: user.full_name,
    role: user.role,
    verification_status: user.verification_status
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

  return { accessToken, refreshToken };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole,
  auditLog,
  generateTokens
};
