const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { db } = require('../db');
const { authenticateToken, auditLog } = require('../middleware/auth');

// POST /api/developer/apps — Register an integration app
router.post('/apps', authenticateToken, (req, res) => {
  try {
    const { name, description, website_url, callback_url } = req.body;

    if (!name || !callback_url) {
      return res.status(400).json({ error: 'App name and callback URL required' });
    }

    const appId = uuidv4();
    const clientId = 'gp_' + crypto.randomBytes(8).toString('hex');
    const clientSecret = 'gps_' + crypto.randomBytes(24).toString('hex');

    // Create developer app
    db.prepare(`INSERT INTO developer_apps (id, owner_id, name, description, website_url, callback_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))`)
      .run(appId, req.user.id, name, description, website_url, callback_url);

    // Create OAuth client
    db.prepare(`INSERT INTO oauth_clients (id, client_id, client_secret, name, description, redirect_uris, owner_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
      .run(uuidv4(), clientId, clientSecret, name, description, callback_url, req.user.id);

    auditLog(req, 'developer.app.create', 'developer_apps', appId, { name });

    res.status(201).json({
      app: {
        id: appId,
        name,
        description,
        website_url,
        callback_url,
        client_id: clientId,
        client_secret: clientSecret,
        status: 'active',
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Create app error:', err);
    res.status(500).json({ error: 'Failed to create app' });
  }
});

// GET /api/developer/apps — List developer apps
router.get('/apps', authenticateToken, (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT da.*, oc.client_id, oc.scopes
      FROM developer_apps da
      LEFT JOIN oauth_clients oc ON da.name = oc.name AND da.owner_id = oc.owner_id
      WHERE da.owner_id = ?
      ORDER BY da.created_at DESC
    `).all(req.user.id);

    res.json({ apps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch apps' });
  }
});

// POST /api/developer/apps/:id/keys — Generate API keys
router.post('/apps/:id/keys', authenticateToken, (req, res) => {
  try {
    const { environment } = req.body;

    const app = db.prepare('SELECT * FROM developer_apps WHERE id = ? AND owner_id = ?')
      .get(req.params.id, req.user.id);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const apiKey = 'gpk_' + crypto.randomBytes(16).toString('hex');
    const apiSecret = 'gpks_' + crypto.randomBytes(32).toString('hex');

    db.prepare(`INSERT INTO api_keys (id, client_id, api_key, api_secret, environment, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`)
      .run(uuidv4(), req.params.id, apiKey, apiSecret, environment || 'sandbox');

    res.status(201).json({
      api_key: apiKey,
      api_secret: apiSecret,
      environment: environment || 'sandbox',
      message: 'Store these securely. The secret will not be shown again.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate API keys' });
  }
});

// POST /api/developer/webhooks — Register webhook
router.post('/webhooks', authenticateToken, (req, res) => {
  try {
    const { app_id, url, events } = req.body;

    if (!app_id || !url || !events) {
      return res.status(400).json({ error: 'App ID, URL, and events required' });
    }

    const secret = 'gpwh_' + crypto.randomBytes(24).toString('hex');

    db.prepare(`INSERT INTO webhooks (id, client_id, url, events, secret, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`)
      .run(uuidv4(), app_id, url, JSON.stringify(events), secret);

    res.status(201).json({
      webhook: {
        url,
        events,
        secret,
        message: 'Webhook registered. Use the secret to verify payloads.'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});

module.exports = router;
