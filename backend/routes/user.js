const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/user/profile
router.get('/profile', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, ghana_card_number, phone, full_name, date_of_birth, email,
             verification_status, role, mfa_enabled, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get linked services count
    const linkedServices = db.prepare(
      'SELECT COUNT(*) as count FROM consent_records WHERE user_id = ? AND granted = 1 AND revoked_at IS NULL'
    ).get(req.user.id).count;

    // Get signed documents count
    const signedDocs = db.prepare(
      'SELECT COUNT(*) as count FROM signatures WHERE user_id = ?'
    ).get(req.user.id).count;

    res.json({
      ...user,
      stats: {
        linked_services: linkedServices,
        signed_documents: signedDocs
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/user/activity — Login activity
router.get('/activity', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const activities = db.prepare(`
      SELECT * FROM login_activity
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(limit), offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM login_activity WHERE user_id = ?')
      .get(req.user.id).count;

    res.json({ activities, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/user/consents — Linked services
router.get('/consents', (req, res) => {
  try {
    const consents = db.prepare(`
      SELECT cr.*, oc.name as service_name, oc.description as service_description, oc.logo_url
      FROM consent_records cr
      JOIN oauth_clients oc ON cr.client_id = oc.client_id
      WHERE cr.user_id = ? AND cr.granted = 1 AND cr.revoked_at IS NULL
      ORDER BY cr.created_at DESC
    `).all(req.user.id);

    res.json({ consents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

// DELETE /api/user/consents/:id — Revoke consent
router.delete('/consents/:id', (req, res) => {
  try {
    const consent = db.prepare('SELECT * FROM consent_records WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!consent) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    db.prepare('UPDATE consent_records SET revoked_at = datetime(?) WHERE id = ?')
      .run(new Date().toISOString(), req.params.id);

    // Also revoke OAuth tokens for this client
    db.prepare('DELETE FROM oauth_tokens WHERE client_id = ? AND user_id = ?')
      .run(consent.client_id, req.user.id);

    res.json({ message: 'Consent revoked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke consent' });
  }
});

module.exports = router;
