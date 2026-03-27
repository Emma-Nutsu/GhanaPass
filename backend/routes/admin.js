const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticateToken, requireRole, auditLog } = require('../middleware/auth');

// All admin routes require admin role
router.use(authenticateToken, requireRole('admin'));

// GET /api/admin/stats — Dashboard statistics
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const verifiedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE verification_status = 'verified'").get().count;
    const pendingUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE verification_status = 'pending'").get().count;
    const flaggedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE verification_status = 'flagged'").get().count;
    const totalVerifications = db.prepare('SELECT COUNT(*) as count FROM sim_verifications').get().count;
    const totalDocsSigned = db.prepare('SELECT COUNT(*) as count FROM signatures').get().count;
    const totalOAuthClients = db.prepare('SELECT COUNT(*) as count FROM oauth_clients').get().count;
    const openFraudAlerts = db.prepare("SELECT COUNT(*) as count FROM fraud_alerts WHERE status = 'open'").get().count;
    const todayLogins = db.prepare("SELECT COUNT(*) as count FROM login_activity WHERE action = 'login' AND created_at > datetime('now', '-1 day')").get().count;
    const recentAuditLogs = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE created_at > datetime('now', '-1 day')").get().count;

    // Monthly registrations (last 6 months)
    const monthlyRegistrations = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM users
      WHERE created_at > datetime('now', '-6 months')
      GROUP BY month ORDER BY month
    `).all();

    // Verification distribution
    const verificationDistribution = db.prepare(`
      SELECT verification_status, COUNT(*) as count FROM users GROUP BY verification_status
    `).all();

    res.json({
      overview: {
        total_users: totalUsers,
        verified_users: verifiedUsers,
        pending_users: pendingUsers,
        flagged_users: flaggedUsers,
        total_verifications: totalVerifications,
        documents_signed: totalDocsSigned,
        oauth_clients: totalOAuthClients,
        open_fraud_alerts: openFraudAlerts,
        today_logins: todayLogins,
        recent_audit_logs: recentAuditLogs
      },
      charts: {
        monthly_registrations: monthlyRegistrations,
        verification_distribution: verificationDistribution
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users — List/search users
router.get('/users', (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT id, ghana_card_number, phone, full_name, date_of_birth, email, verification_status, role, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (full_name LIKE ? OR ghana_card_number LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      query += ' AND verification_status = ?';
      params.push(status);
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM');
    const total = db.prepare(countQuery).get(...params).count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const users = db.prepare(query).all(...params);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/status — Update user status
router.put('/users/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'verified', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('UPDATE users SET verification_status = ?, updated_at = datetime(?) WHERE id = ?')
      .run(status, new Date().toISOString(), req.params.id);

    auditLog(req, 'admin.user.status', 'users', req.params.id, {
      old_status: user.verification_status,
      new_status: status
    });

    res.json({ message: 'User status updated', user_id: req.params.id, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/admin/verifications — Verification logs
router.get('/verifications', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const logs = db.prepare(`
      SELECT al.*, u.full_name, u.ghana_card_number
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action LIKE '%verify%' OR al.action LIKE '%identity%' OR al.action LIKE '%face%'
      ORDER BY al.created_at DESC LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE action LIKE '%verify%' OR action LIKE '%identity%' OR action LIKE '%face%'
    `).get().count;

    res.json({ logs, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch verification logs' });
  }
});

// GET /api/admin/fraud — Fraud alerts
router.get('/fraud', (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `SELECT fa.*, u.full_name, u.ghana_card_number
      FROM fraud_alerts fa LEFT JOIN users u ON fa.user_id = u.id WHERE 1=1`;
    const params = [];

    if (status) {
      query += ' AND fa.status = ?';
      params.push(status);
    }

    query += ' ORDER BY fa.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const alerts = db.prepare(query).all(...params);

    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fraud alerts' });
  }
});

// PUT /api/admin/fraud/:id — Update fraud alert status
router.put('/fraud/:id', (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.prepare('UPDATE fraud_alerts SET status = ?, resolved_by = ?, resolved_at = datetime(?) WHERE id = ?')
      .run(status, req.user.id, status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : null, req.params.id);

    res.json({ message: 'Fraud alert updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// GET /api/admin/integrations — List OAuth clients
router.get('/integrations', (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT oc.*, u.full_name as owner_name
      FROM oauth_clients oc
      LEFT JOIN users u ON oc.owner_id = u.id
      ORDER BY oc.created_at DESC
    `).all();

    res.json({ clients });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// GET /api/admin/activity-feed — Real-time activity feed with simulated locations
router.get('/activity-feed', (req, res) => {
  try {
    const { type, limit = 50 } = req.query;

    let query = `SELECT la.*, u.full_name, u.ghana_card_number, u.verification_status
      FROM login_activity la
      LEFT JOIN users u ON la.user_id = u.id
      WHERE 1=1`;
    const params = [];

    if (type) {
      query += ' AND la.action = ?';
      params.push(type);
    }

    query += ' ORDER BY la.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const activities = db.prepare(query).all(...params);

    // Enrich with simulated GPS coordinates for each activity
    const regionCoords = {
      'Greater Accra': { lat: 5.6037, lng: -0.1870 },
      'Ashanti': { lat: 6.6885, lng: -1.6244 },
      'Northern': { lat: 9.4034, lng: -0.8424 },
      'Central': { lat: 5.1109, lng: -1.2467 },
      'Western': { lat: 4.9016, lng: -1.7831 },
      'Volta': { lat: 6.6025, lng: 0.4699 },
      'Eastern': { lat: 6.0925, lng: -0.4635 },
      'Bono': { lat: 7.3349, lng: -2.3264 },
      'Upper East': { lat: 10.7633, lng: -0.8106 },
      'Upper West': { lat: 10.0607, lng: -2.5027 },
      'Savannah': { lat: 8.5568, lng: -1.5710 },
      'Ahafo': { lat: 7.0835, lng: -2.5428 },
      'Bono East': { lat: 7.7500, lng: -1.0590 },
      'North East': { lat: 10.5135, lng: -0.3674 },
      'Oti': { lat: 7.9000, lng: 0.3000 },
      'Western North': { lat: 6.0667, lng: -2.5000 }
    };

    const enriched = activities.map(a => {
      const regionName = a.location ? a.location.split(',')[0].trim() : null;
      let coords = regionCoords[regionName] || regionCoords['Greater Accra'];
      // Add jitter for realism
      coords = {
        lat: coords.lat + (Math.random() - 0.5) * 0.2,
        lng: coords.lng + (Math.random() - 0.5) * 0.2
      };
      return { ...a, coordinates: coords };
    });

    res.json({ activities: enriched });
  } catch (err) {
    console.error('Activity feed error:', err);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// GET /api/admin/map-data — Aggregated map data for Ghana
router.get('/map-data', (req, res) => {
  try {
    const regions = [
      { name: 'Greater Accra', lat: 5.6037, lng: -0.1870 },
      { name: 'Ashanti', lat: 6.6885, lng: -1.6244 },
      { name: 'Northern', lat: 9.4034, lng: -0.8424 },
      { name: 'Central', lat: 5.1109, lng: -1.2467 },
      { name: 'Western', lat: 4.9016, lng: -1.7831 },
      { name: 'Volta', lat: 6.6025, lng: 0.4699 },
      { name: 'Eastern', lat: 6.0925, lng: -0.4635 },
      { name: 'Bono', lat: 7.3349, lng: -2.3264 },
      { name: 'Upper East', lat: 10.7633, lng: -0.8106 },
      { name: 'Upper West', lat: 10.0607, lng: -2.5027 }
    ];

    // Generate simulated activity for each region
    const regionData = regions.map(r => {
      const logins = Math.floor(Math.random() * 200) + 10;
      const registrations = Math.floor(Math.random() * 50) + 2;
      const verifications = Math.floor(Math.random() * 80) + 5;
      const suspicious = Math.floor(Math.random() * 8);
      return {
        ...r,
        stats: { logins, registrations, verifications, suspicious },
        total_activity: logins + registrations + verifications,
        risk_level: suspicious > 5 ? 'high' : suspicious > 2 ? 'medium' : 'low'
      };
    });

    // Simulated live activity points (recent 1 hour)
    const livePoints = [];
    for (let i = 0; i < 30; i++) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const actions = ['login', 'register', 'login_failed', 'verification', 'document_sign'];
      livePoints.push({
        lat: region.lat + (Math.random() - 0.5) * 0.4,
        lng: region.lng + (Math.random() - 0.5) * 0.4,
        action: actions[Math.floor(Math.random() * actions.length)],
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        region: region.name
      });
    }

    res.json({ regions: regionData, live_points: livePoints });
  } catch (err) {
    console.error('Map data error:', err);
    res.status(500).json({ error: 'Failed to fetch map data' });
  }
});

// GET /api/admin/fraud-report/:userId — Detailed fraud report for a user
router.get('/fraud-report/:userId', (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, ghana_card_number, phone, full_name, date_of_birth, email, verification_status, role, created_at FROM users WHERE id = ?'
    ).get(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Login activity history
    const loginHistory = db.prepare(
      `SELECT * FROM login_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
    ).all(req.params.userId);

    // Fraud alerts for this user
    const alerts = db.prepare(
      `SELECT * FROM fraud_alerts WHERE user_id = ? ORDER BY created_at DESC`
    ).all(req.params.userId);

    // Audit logs
    const auditLogs = db.prepare(
      `SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
    ).all(req.params.userId);

    // Simulated location history
    const locationNames = ['Accra, Greater Accra', 'Kumasi, Ashanti', 'Tamale, Northern', 'Cape Coast, Central', 'Takoradi, Western', 'Ho, Volta', 'Tema, Greater Accra'];
    const locationHistory = loginHistory.map(l => ({
      timestamp: l.created_at,
      location: l.location || locationNames[Math.floor(Math.random() * locationNames.length)],
      action: l.action,
      success: l.success,
      ip_address: l.ip_address,
      device: l.device
    }));

    // Compute risk score
    const failedLogins = loginHistory.filter(l => l.success === 0).length;
    const totalLogins = loginHistory.length;
    const alertCount = alerts.length;
    const riskScore = Math.min(100, (failedLogins * 15) + (alertCount * 25) + (totalLogins > 20 ? 10 : 0));

    res.json({
      user,
      risk_score: riskScore,
      risk_level: riskScore > 70 ? 'critical' : riskScore > 40 ? 'high' : riskScore > 20 ? 'medium' : 'low',
      login_history: loginHistory,
      location_history: locationHistory,
      fraud_alerts: alerts,
      audit_logs: auditLogs,
      summary: {
        total_logins: totalLogins,
        failed_logins: failedLogins,
        success_rate: totalLogins > 0 ? ((totalLogins - failedLogins) / totalLogins * 100).toFixed(1) : '100.0',
        active_alerts: alerts.filter(a => a.status === 'open' || a.status === 'investigating').length,
        unique_locations: [...new Set(locationHistory.map(l => l.location))].length
      }
    });
  } catch (err) {
    console.error('Fraud report error:', err);
    res.status(500).json({ error: 'Failed to generate fraud report' });
  }
});

module.exports = router;
