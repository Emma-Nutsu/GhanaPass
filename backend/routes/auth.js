const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { generateTokens, authenticateToken, auditLog, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { ghana_card_number, phone, password, email } = req.body;

    if (!ghana_card_number || !phone || !password) {
      return res.status(400).json({ error: 'Missing required fields: ghana_card_number, phone, password' });
    }

    // Lookup in Ghana Card Registry
    const citizen = db.prepare('SELECT * FROM ghana_card_registry WHERE card_number = ?').get(ghana_card_number);
    if (!citizen) {
      return res.status(400).json({ error: 'Invalid Ghana Card Number. Cannot create account.' });
    }

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE ghana_card_number = ?').get(ghana_card_number);
    if (existing) {
      return res.status(409).json({ error: 'Ghana Card already registered' });
    }

    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 12);
    const pin_hash = bcrypt.hashSync('1234', 10);

    // Auto-fill from registry, auto-verify (facial scan already passed)
    db.prepare(`INSERT INTO users (id, ghana_card_number, phone, full_name, date_of_birth, email, password_hash, pin_hash, verification_status, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified', 'citizen')`)
      .run(id, ghana_card_number, phone, citizen.full_name, citizen.date_of_birth, email || null, password_hash, pin_hash);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const tokens = generateTokens(user);

    // Log activity
    const locations = ['Accra, Ghana', 'Kumasi, Ghana', 'Tamale, Ghana', 'Cape Coast, Ghana', 'Takoradi, Ghana'];
    const location = citizen.region ? `${citizen.region}, Ghana` : locations[Math.floor(Math.random() * locations.length)];

    db.prepare(`INSERT INTO login_activity (id, user_id, action, device, ip_address, location, success, created_at)
      VALUES (?, ?, 'register', ?, ?, ?, 1, datetime('now'))`)
      .run(uuidv4(), id, req.headers['user-agent'] || 'Unknown', req.ip, location);

    db.prepare(`INSERT INTO audit_logs (id, user_id, action, resource, details, ip_address, created_at)
      VALUES (?, ?, 'user.register', 'users', ?, ?, datetime('now'))`)
      .run(uuidv4(), id, JSON.stringify({ ghana_card_number, auto_verified: true }), req.ip);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        ghana_card_number: user.ghana_card_number,
        phone: user.phone,
        full_name: user.full_name,
        date_of_birth: user.date_of_birth,
        verification_status: user.verification_status,
        role: user.role
      },
      tokens
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login — Step 1: validate credentials, return temp token for face verify
router.post('/login', (req, res) => {
  try {
    const { ghana_card_number, password } = req.body;

    if (!ghana_card_number || !password) {
      return res.status(400).json({ error: 'Ghana Card number and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE ghana_card_number = ?').get(ghana_card_number);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      db.prepare(`INSERT INTO login_activity (id, user_id, action, device, ip_address, location, success, created_at)
        VALUES (?, ?, 'login_failed', ?, ?, 'Ghana', 0, datetime('now'))`)
        .run(uuidv4(), user.id, req.headers['user-agent'] || 'Unknown', req.ip);

      const recentFailures = db.prepare(
        `SELECT COUNT(*) as count FROM login_activity WHERE user_id = ? AND success = 0 AND created_at > datetime('now', '-1 hour')`
      ).get(user.id);

      if (recentFailures.count >= 5) {
        db.prepare(`INSERT INTO fraud_alerts (id, user_id, alert_type, severity, description, status, created_at)
          VALUES (?, ?, 'multiple_failed_logins', 'high', ?, 'open', datetime('now'))`)
          .run(uuidv4(), user.id, `${recentFailures.count} failed login attempts in the last hour`);
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a temporary token for face verification step
    const tempToken = jwt.sign(
      { id: user.id, type: 'face_verify_pending', ghana_card_number: user.ghana_card_number },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({
      message: 'Credentials verified. Face verification required.',
      requires_face_verify: true,
      temp_token: tempToken,
      user: {
        full_name: user.full_name,
        ghana_card_number: user.ghana_card_number
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/verify-face — Step 2: complete login after face scan
router.post('/verify-face', (req, res) => {
  try {
    const { temp_token } = req.body;

    if (!temp_token) {
      return res.status(400).json({ error: 'Temporary token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(temp_token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    if (decoded.type !== 'face_verify_pending') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Simulate face match (always succeeds)
    const faceMatchScore = 0.92 + Math.random() * 0.07;
    const livenessScore = 0.88 + Math.random() * 0.11;

    const tokens = generateTokens(user);

    // Store session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`INSERT INTO sessions (id, user_id, token, refresh_token, device_info, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(sessionId, user.id, tokens.accessToken, tokens.refreshToken, req.headers['user-agent'], req.ip, expiresAt);

    // Simulated location
    const locations = ['Accra, Greater Accra', 'Kumasi, Ashanti', 'Tamale, Northern', 'Cape Coast, Central', 'Takoradi, Western', 'Ho, Volta', 'Koforidua, Eastern'];
    const location = locations[Math.floor(Math.random() * locations.length)];

    db.prepare(`INSERT INTO login_activity (id, user_id, action, device, ip_address, location, success, created_at)
      VALUES (?, ?, 'login', ?, ?, ?, 1, datetime('now'))`)
      .run(uuidv4(), user.id, req.headers['user-agent'] || 'Unknown', req.ip, location);

    res.json({
      message: 'Login successful',
      face_match: {
        score: parseFloat(faceMatchScore.toFixed(4)),
        liveness: parseFloat(livenessScore.toFixed(4)),
        verified: true
      },
      user: {
        id: user.id,
        ghana_card_number: user.ghana_card_number,
        phone: user.phone,
        full_name: user.full_name,
        verification_status: user.verification_status,
        role: user.role
      },
      tokens
    });
  } catch (err) {
    console.error('Face verify error:', err);
    res.status(500).json({ error: 'Face verification failed' });
  }
});

// POST /api/auth/otp/send — Send OTP to user's phone
router.post('/otp/send', (req, res) => {
  try {
    const { ghana_card_number } = req.body;

    if (!ghana_card_number) {
      return res.status(400).json({ error: 'Ghana Card number required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE ghana_card_number = ?').get(ghana_card_number);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this Ghana Card number' });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

    // Invalidate old OTPs
    db.prepare('UPDATE otp_codes SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);

    db.prepare(`INSERT INTO otp_codes (id, user_id, code, expires_at) VALUES (?, ?, ?, ?)`)
      .run(uuidv4(), user.id, code, expiresAt);

    // Mask phone for display
    const maskedPhone = user.phone.replace(/(\+233)\d{6}(\d{3})/, '$1******$2');

    console.log(`📱 OTP for ${user.ghana_card_number}: ${code}`); // Log for demo purposes

    res.json({
      message: 'OTP sent successfully',
      masked_phone: maskedPhone,
      otp_hint: code, // Include in response for demo purposes
      expires_in: 300 // seconds
    });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/otp/verify — Verify OTP code
router.post('/otp/verify', (req, res) => {
  try {
    const { ghana_card_number, code } = req.body;

    if (!ghana_card_number || !code) {
      return res.status(400).json({ error: 'Ghana Card number and OTP code required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE ghana_card_number = ?').get(ghana_card_number);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = db.prepare(
      `SELECT * FROM otp_codes WHERE user_id = ? AND code = ? AND used = 0 AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1`
    ).get(user.id, code);

    if (!otp) {
      return res.status(401).json({ error: 'Invalid or expired OTP code' });
    }

    // Mark OTP as used
    db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id);

    // Return temp token for face verification
    const tempToken = jwt.sign(
      { id: user.id, type: 'face_verify_pending', ghana_card_number: user.ghana_card_number },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({
      message: 'OTP verified. Face verification required.',
      requires_face_verify: true,
      temp_token: tempToken,
      user: {
        full_name: user.full_name,
        ghana_card_number: user.ghana_card_number
      }
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// POST /api/auth/biometric — Simulate biometric login
router.post('/biometric', (req, res) => {
  try {
    const { ghana_card_number } = req.body;

    if (!ghana_card_number) {
      return res.status(400).json({ error: 'Ghana Card number required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE ghana_card_number = ?').get(ghana_card_number);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this Ghana Card number' });
    }

    // Simulate biometric match (always succeeds)
    const biometricScore = 0.90 + Math.random() * 0.09;

    // Return temp token for face verification
    const tempToken = jwt.sign(
      { id: user.id, type: 'face_verify_pending', ghana_card_number: user.ghana_card_number },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({
      message: 'Biometric verified. Face verification required.',
      requires_face_verify: true,
      biometric_score: parseFloat(biometricScore.toFixed(4)),
      temp_token: tempToken,
      user: {
        full_name: user.full_name,
        ghana_card_number: user.ghana_card_number
      }
    });
  } catch (err) {
    console.error('Biometric error:', err);
    res.status(500).json({ error: 'Biometric verification failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refresh_token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tokens = generateTokens(user);
    res.json({ tokens });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user.id);

    db.prepare(`INSERT INTO login_activity (id, user_id, action, device, ip_address, location, success, created_at)
      VALUES (?, ?, 'logout', ?, ?, 'Ghana', 1, datetime('now'))`)
      .run(uuidv4(), req.user.id, req.headers['user-agent'] || 'Unknown', req.ip);

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
