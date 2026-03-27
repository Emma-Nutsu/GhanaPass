const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticateToken, auditLog } = require('../middleware/auth');

// POST /api/verify/identity — Mock Ghana Card Verification
router.post('/identity', authenticateToken, (req, res) => {
  try {
    const { ghana_card_number } = req.body;

    if (!ghana_card_number) {
      return res.status(400).json({ error: 'Ghana Card number required' });
    }

    // Mock Ghana Card Database verification
    const ghanaCardPattern = /^GHA-\d{9}-\d$/;
    if (!ghanaCardPattern.test(ghana_card_number)) {
      auditLog(req, 'identity.verify.failed', 'verification', null, { reason: 'Invalid format' });
      return res.json({
        verified: false,
        reason: 'Invalid Ghana Card number format. Expected: GHA-XXXXXXXXX-X'
      });
    }

    // Simulate verification delay
    const user = db.prepare('SELECT * FROM users WHERE ghana_card_number = ?').get(ghana_card_number);

    // Mock NIA (National Identification Authority) response
    const mockNIAData = {
      card_number: ghana_card_number,
      full_name: user ? user.full_name : 'John Doe',
      date_of_birth: user ? user.date_of_birth : '1990-01-01',
      gender: 'Male',
      nationality: 'Ghanaian',
      place_of_birth: 'Accra',
      date_of_issue: '2020-01-15',
      date_of_expiry: '2030-01-15',
      card_status: 'active'
    };

    // Update user verification status
    if (user) {
      db.prepare('UPDATE users SET verification_status = ? WHERE id = ?')
        .run('verified', user.id);
    }

    auditLog(req, 'identity.verify.success', 'verification', ghana_card_number, mockNIAData);

    res.json({
      verified: true,
      confidence: 0.98,
      nia_data: mockNIAData,
      verification_id: uuidv4(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Identity verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/verify/face — Mock Facial Recognition
router.post('/face', authenticateToken, (req, res) => {
  try {
    const { user_id, selfie_data } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id || req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock facial recognition results
    const livenessScore = 0.85 + Math.random() * 0.14; // 0.85-0.99
    const matchScore = 0.80 + Math.random() * 0.19;    // 0.80-0.99
    const isLive = livenessScore > 0.7;
    const isMatch = matchScore > 0.75;

    const result = {
      verification_id: uuidv4(),
      liveness: {
        score: parseFloat(livenessScore.toFixed(4)),
        is_live: isLive,
        checks: {
          blink_detected: true,
          head_movement: true,
          texture_analysis: true,
          depth_analysis: isLive
        }
      },
      face_match: {
        score: parseFloat(matchScore.toFixed(4)),
        is_match: isMatch,
        id_photo_source: 'ghana_card_database'
      },
      overall: {
        verified: isLive && isMatch,
        confidence: parseFloat(((livenessScore + matchScore) / 2).toFixed(4))
      },
      timestamp: new Date().toISOString()
    };

    if (result.overall.verified) {
      db.prepare('UPDATE users SET verification_status = ? WHERE id = ?')
        .run('verified', user.id);
    }

    auditLog(req, 'face.verify', 'verification', user.id, result);

    res.json(result);
  } catch (err) {
    console.error('Face verification error:', err);
    res.status(500).json({ error: 'Face verification failed' });
  }
});

module.exports = router;
