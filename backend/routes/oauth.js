const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticateToken, JWT_SECRET, auditLog } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// GET /api/oauth/authorize — Authorization endpoint
router.get('/authorize', (req, res) => {
  try {
    const { client_id, redirect_uri, response_type, scope, state } = req.query;

    if (!client_id || !redirect_uri || response_type !== 'code') {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing or invalid parameters. Required: client_id, redirect_uri, response_type=code'
      });
    }

    const client = db.prepare('SELECT * FROM oauth_clients WHERE client_id = ? AND is_active = 1').get(client_id);
    if (!client) {
      return res.status(400).json({ error: 'invalid_client', error_description: 'Client not found' });
    }

    // Return client info for consent screen (frontend renders consent UI)
    res.json({
      client: {
        id: client.client_id,
        name: client.name,
        description: client.description,
        logo_url: client.logo_url
      },
      requested_scopes: (scope || 'openid profile').split(' '),
      redirect_uri,
      state
    });
  } catch (err) {
    console.error('OAuth authorize error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// POST /api/oauth/authorize — Grant authorization (after consent)
router.post('/authorize', authenticateToken, (req, res) => {
  try {
    const { client_id, redirect_uri, scope, state, approved } = req.body;

    if (!approved) {
      return res.json({
        redirect: `${redirect_uri}?error=access_denied&state=${state || ''}`
      });
    }

    const client = db.prepare('SELECT * FROM oauth_clients WHERE client_id = ? AND is_active = 1').get(client_id);
    if (!client) {
      return res.status(400).json({ error: 'invalid_client' });
    }

    // Generate authorization code
    const code = uuidv4().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    db.prepare(`INSERT INTO oauth_codes (id, code, client_id, user_id, redirect_uri, scopes, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), code, client_id, req.user.id, redirect_uri, scope || 'openid profile', expiresAt);

    // Store consent
    db.prepare(`INSERT INTO consent_records (id, user_id, client_id, scopes, granted, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))`)
      .run(uuidv4(), req.user.id, client_id, scope || 'openid profile');

    auditLog(req, 'consent.grant', 'oauth', client_id, { scopes: scope });

    res.json({
      redirect: `${redirect_uri}?code=${code}&state=${state || ''}`
    });
  } catch (err) {
    console.error('OAuth authorize grant error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// POST /api/oauth/token — Token exchange
router.post('/token', (req, res) => {
  try {
    const { grant_type, code, client_id, client_secret, redirect_uri, refresh_token } = req.body;

    if (grant_type === 'authorization_code') {
      if (!code || !client_id || !client_secret) {
        return res.status(400).json({ error: 'invalid_request' });
      }

      // Verify client credentials
      const client = db.prepare('SELECT * FROM oauth_clients WHERE client_id = ? AND client_secret = ?')
        .get(client_id, client_secret);
      if (!client) {
        return res.status(401).json({ error: 'invalid_client' });
      }

      // Verify authorization code
      const authCode = db.prepare('SELECT * FROM oauth_codes WHERE code = ? AND client_id = ? AND used = 0')
        .get(code, client_id);
      if (!authCode) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired code' });
      }

      if (new Date(authCode.expires_at) < new Date()) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'Code expired' });
      }

      // Mark code as used
      db.prepare('UPDATE oauth_codes SET used = 1 WHERE id = ?').run(authCode.id);

      // Get user
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(authCode.user_id);

      // Generate tokens
      const accessToken = jwt.sign({
        sub: user.id,
        name: user.full_name,
        scope: authCode.scopes,
        client_id: client_id,
        type: 'oauth_access'
      }, JWT_SECRET, { expiresIn: '1h' });

      const newRefreshToken = jwt.sign({
        sub: user.id,
        client_id: client_id,
        type: 'oauth_refresh'
      }, JWT_SECRET, { expiresIn: '30d' });

      // Store tokens
      const tokenId = uuidv4();
      db.prepare(`INSERT INTO oauth_tokens (id, access_token, refresh_token, client_id, user_id, scopes, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+1 hour'))`)
        .run(tokenId, accessToken, newRefreshToken, client_id, user.id, authCode.scopes);

      // Generate ID token (OpenID Connect)
      const idToken = jwt.sign({
        iss: 'https://ghanapass.gov.gh',
        sub: user.id,
        aud: client_id,
        name: user.full_name,
        ghana_card: user.ghana_card_number,
        phone: user.phone,
        verified: user.verification_status === 'verified',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }, JWT_SECRET);

      res.json({
        access_token: accessToken,
        refresh_token: newRefreshToken,
        id_token: idToken,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: authCode.scopes
      });
    } else if (grant_type === 'refresh_token') {
      if (!refresh_token || !client_id) {
        return res.status(400).json({ error: 'invalid_request' });
      }

      try {
        const decoded = jwt.verify(refresh_token, JWT_SECRET);
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.sub);

        const accessToken = jwt.sign({
          sub: user.id,
          name: user.full_name,
          client_id: client_id,
          type: 'oauth_access'
        }, JWT_SECRET, { expiresIn: '1h' });

        res.json({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600
        });
      } catch {
        return res.status(400).json({ error: 'invalid_grant' });
      }
    } else {
      return res.status(400).json({ error: 'unsupported_grant_type' });
    }
  } catch (err) {
    console.error('Token exchange error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/oauth/userinfo — OpenID Connect UserInfo
router.get('/userinfo', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id || req.user.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      sub: user.id,
      name: user.full_name,
      phone_number: user.phone,
      ghana_card_number: user.ghana_card_number,
      date_of_birth: user.date_of_birth,
      email: user.email,
      email_verified: !!user.email,
      phone_number_verified: true,
      identity_verified: user.verification_status === 'verified',
      verification_status: user.verification_status,
      updated_at: user.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

module.exports = router;
