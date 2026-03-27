const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticateToken, auditLog } = require('../middleware/auth');

// POST /api/sim/verify — SIM Card Verification
router.post('/verify', authenticateToken, (req, res) => {
  try {
    const { phone_number, ghana_card_number, provider } = req.body;

    if (!phone_number || !ghana_card_number) {
      return res.status(400).json({ error: 'Phone number and Ghana Card number required' });
    }

    // Validate phone format (Ghana: +233XXXXXXXXX)
    const phonePattern = /^\+233\d{9}$/;
    if (!phonePattern.test(phone_number)) {
      return res.status(400).json({ error: 'Invalid Ghana phone number format. Expected: +233XXXXXXXXX' });
    }

    // Check identity match
    const user = db.prepare('SELECT * FROM users WHERE ghana_card_number = ? AND phone = ?')
      .get(ghana_card_number, phone_number);

    const verificationId = uuidv4();
    const isVerified = !!user;

    // Detect provider from phone number prefix
    const prefix = phone_number.substring(4, 6);
    const detectedProvider = provider || detectProvider(prefix);

    // Store verification
    db.prepare(`INSERT INTO sim_verifications (id, phone_number, user_id, provider, ghana_card_number, status, verified_at, requested_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
      .run(verificationId, phone_number, user?.id || null, detectedProvider, ghana_card_number,
        isVerified ? 'verified' : 'failed',
        isVerified ? new Date().toISOString() : null,
        req.user.id);

    auditLog(req, 'sim.verify', 'sim_verifications', verificationId, {
      phone_number, ghana_card_number, status: isVerified ? 'verified' : 'failed'
    });

    res.json({
      verification_id: verificationId,
      status: isVerified ? 'verified' : 'not_verified',
      phone_number,
      ghana_card_number,
      provider: detectedProvider,
      identity_match: isVerified,
      details: isVerified ? {
        owner_name: user.full_name,
        registration_date: user.created_at,
        verification_method: 'ghana_card + phone_match'
      } : {
        reason: 'No matching identity found for this phone number and Ghana Card combination'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('SIM verification error:', err);
    res.status(500).json({ error: 'SIM verification failed' });
  }
});

function detectProvider(prefix) {
  const providers = {
    '20': 'Telecel', '24': 'MTN', '25': 'MTN', '26': 'AirtelTigo',
    '27': 'AirtelTigo', '50': 'Telecel', '54': 'MTN', '55': 'MTN',
    '56': 'AirtelTigo', '57': 'AirtelTigo', '23': 'Glo'
  };
  return providers[prefix] || 'Unknown';
}

module.exports = router;
