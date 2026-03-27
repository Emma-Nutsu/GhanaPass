const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'ghana_pass.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      ghana_card_number TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      full_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      email TEXT,
      pin_hash TEXT,
      password_hash TEXT NOT NULL,
      face_data TEXT,
      id_photo_url TEXT,
      selfie_url TEXT,
      verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','rejected','flagged')),
      role TEXT DEFAULT 'citizen' CHECK(role IN ('citizen','admin','developer')),
      device_fingerprint TEXT,
      mfa_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      refresh_token TEXT,
      device_info TEXT,
      ip_address TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS oauth_clients (
      id TEXT PRIMARY KEY,
      client_id TEXT UNIQUE NOT NULL,
      client_secret TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      redirect_uris TEXT NOT NULL,
      logo_url TEXT,
      owner_id TEXT,
      scopes TEXT DEFAULT 'openid profile',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS oauth_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      scopes TEXT,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS oauth_tokens (
      id TEXT PRIMARY KEY,
      access_token TEXT UNIQUE NOT NULL,
      refresh_token TEXT UNIQUE,
      client_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      scopes TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consent_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      scopes TEXT NOT NULL,
      granted INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT DEFAULT 'application/pdf',
      status TEXT DEFAULT 'uploaded' CHECK(status IN ('uploaded','signed','verified','rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS signatures (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      signature_hash TEXT NOT NULL,
      verification_hash TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      ip_address TEXT,
      method TEXT DEFAULT 'pin' CHECK(method IN ('pin','biometric')),
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sim_verifications (
      id TEXT PRIMARY KEY,
      phone_number TEXT NOT NULL,
      user_id TEXT,
      provider TEXT,
      ghana_card_number TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','verified','failed')),
      verified_at TEXT,
      requested_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      api_secret TEXT NOT NULL,
      environment TEXT DEFAULT 'sandbox' CHECK(environment IN ('sandbox','production')),
      is_active INTEGER DEFAULT 1,
      last_used_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT NOT NULL,
      secret TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS login_activity (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      device TEXT,
      browser TEXT,
      ip_address TEXT,
      location TEXT,
      success INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fraud_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      alert_type TEXT NOT NULL,
      severity TEXT DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
      description TEXT,
      details TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','investigating','resolved','dismissed')),
      resolved_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS developer_apps (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      website_url TEXT,
      callback_url TEXT,
      logo_url TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','suspended','pending')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      bank_code TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_type TEXT DEFAULT 'savings' CHECK(account_type IN ('savings','current','fixed_deposit')),
      branch TEXT,
      iban TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','dormant','closed')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ghana_card_registry (
      card_number TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT DEFAULT 'Male' CHECK(gender IN ('Male','Female')),
      region TEXT,
      address TEXT,
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed Ghana Card Registry (dummy NIA database)
  seedRegistry();

  // Seed default admin user and sample data
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    seedDatabase();
  }
}

function seedRegistry() {
  const citizens = [
    { card: 'GHA-000000001-0', name: 'Kwame Admin', dob: '1985-03-15', gender: 'Male', region: 'Greater Accra', address: '12 Independence Ave, Accra', phone: '+233200000001' },
    { card: 'GHA-123456789-1', name: 'Ama Mensah', dob: '1990-07-22', gender: 'Female', region: 'Greater Accra', address: '45 Cantonments Rd, Accra', phone: '+233240000001' },
    { card: 'GHA-234567890-2', name: 'Kofi Asante', dob: '1988-11-03', gender: 'Male', region: 'Ashanti', address: '8 Prempeh St, Kumasi', phone: '+233270000002' },
    { card: 'GHA-345678901-3', name: 'Abena Osei', dob: '1995-01-15', gender: 'Female', region: 'Central', address: '23 Cape Coast Rd, Cape Coast', phone: '+233550000003' },
    { card: 'GHA-456789012-4', name: 'Yaw Boateng', dob: '1982-09-30', gender: 'Male', region: 'Western', address: '5 Market Circle, Takoradi', phone: '+233200000004' },
    { card: 'GHA-567890123-5', name: 'Efua Darkwa', dob: '1998-04-12', gender: 'Female', region: 'Volta', address: '17 Ho Main Rd, Ho', phone: '+233240000005' },
    { card: 'GHA-678901234-6', name: 'Kwesi Appiah', dob: '1993-06-08', gender: 'Male', region: 'Northern', address: '3 Tamale Central, Tamale', phone: '+233540000006' },
    { card: 'GHA-789012345-7', name: 'Akua Boateng', dob: '1997-12-20', gender: 'Female', region: 'Eastern', address: '14 Koforidua Rd, Koforidua', phone: '+233550000007' },
    { card: 'GHA-890123456-8', name: 'Nana Agyeman', dob: '1986-02-14', gender: 'Male', region: 'Bono', address: '9 Sunyani Main, Sunyani', phone: '+233240000008' },
    { card: 'GHA-901234567-9', name: 'Adwoa Frimpong', dob: '1991-08-25', gender: 'Female', region: 'Upper East', address: '6 Bolga Rd, Bolgatanga', phone: '+233200000009' },
    { card: 'GHA-112233445-0', name: 'Kojo Owusu', dob: '1989-05-11', gender: 'Male', region: 'Greater Accra', address: '31 Tema Community 1, Tema', phone: '+233270000010' },
    { card: 'GHA-223344556-1', name: 'Esi Annan', dob: '1994-10-03', gender: 'Female', region: 'Ashanti', address: '22 Adum St, Kumasi', phone: '+233540000011' },
    { card: 'GHA-334455667-2', name: 'Fiifi Mensah', dob: '2000-01-30', gender: 'Male', region: 'Central', address: '7 Elmina Beach Rd, Elmina', phone: '+233550000012' },
    { card: 'GHA-445566778-3', name: 'Afua Sarpong', dob: '1996-07-17', gender: 'Female', region: 'Western', address: '19 Sekondi Rd, Sekondi', phone: '+233200000013' },
    { card: 'GHA-556677889-4', name: 'Yeboah Mensah', dob: '1987-11-22', gender: 'Male', region: 'Upper West', address: '4 Wa Central, Wa', phone: '+233240000014' },
    { card: 'GHA-667788990-5', name: 'David Attipoe', dob: '1992-05-14', gender: 'Male', region: 'Volta', address: '14 Keta Rd, Ho', phone: '+233240000015' },
    { card: 'GHA-778899001-6', name: 'Gordon Nana Amoako', dob: '1985-11-30', gender: 'Male', region: 'Eastern', address: '22 Akropong St, Akropong', phone: '+233200000016' },
    { card: 'GHA-889900112-7', name: 'John Fynn Addison', dob: '1990-03-22', gender: 'Male', region: 'Central', address: '5 Fynn St, Elmina', phone: '+233270000017' },
    { card: 'GHA-990011223-8', name: 'Ekow Nyanka', dob: '1994-08-09', gender: 'Male', region: 'Western', address: '31 Essikado Rd, Sekondi', phone: '+233540000018' },
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO ghana_card_registry (card_number, full_name, date_of_birth, gender, region, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  citizens.forEach(c => stmt.run(c.card, c.name, c.dob, c.gender, c.region, c.address, c.phone));
  console.log('✅ Ghana Card Registry seeded with', citizens.length, 'citizens');
}

function seedDatabase() {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const adminId = uuidv4();
  const adminHash = bcrypt.hashSync('admin123', 10);
  const pinHash = bcrypt.hashSync('1234', 10);

  // Admin user
  db.prepare(`INSERT INTO users (id, ghana_card_number, phone, full_name, date_of_birth, email, password_hash, pin_hash, verification_status, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified', 'admin')`)
    .run(adminId, 'GHA-000000001-0', '+233200000001', 'Kwame Admin', '1985-03-15', 'admin@ghanapass.gov.gh', adminHash, pinHash);

  // Sample citizens
  const citizens = [
    { name: 'Ama Mensah', card: 'GHA-123456789-1', phone: '+233240000001', dob: '1990-07-22', status: 'verified' },
    { name: 'Kofi Asante', card: 'GHA-234567890-2', phone: '+233270000002', dob: '1988-11-03', status: 'verified' },
    { name: 'Abena Osei', card: 'GHA-345678901-3', phone: '+233550000003', dob: '1995-01-15', status: 'pending' },
    { name: 'Yaw Boateng', card: 'GHA-456789012-4', phone: '+233200000004', dob: '1982-09-30', status: 'flagged' },
    { name: 'Efua Darkwa', card: 'GHA-567890123-5', phone: '+233240000005', dob: '1998-04-12', status: 'verified' },
  ];

  const userIds = [];
  citizens.forEach(c => {
    const id = uuidv4();
    userIds.push(id);
    db.prepare(`INSERT INTO users (id, ghana_card_number, phone, full_name, date_of_birth, password_hash, pin_hash, verification_status, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'citizen')`)
      .run(id, c.card, c.phone, c.name, c.dob, bcrypt.hashSync('pass123', 10), pinHash, c.status);
  });

  // Sample OAuth clients
  const clients = [
    { name: 'Ghana Revenue Authority', desc: 'GRA Tax Filing Portal', redirect: 'https://gra.gov.gh/callback' },
    { name: 'MTN Mobile Money', desc: 'Mobile Money Identity Verification', redirect: 'https://momo.mtn.com.gh/callback' },
    { name: 'GCB Bank', desc: 'Digital Banking Platform', redirect: 'https://gcb.com.gh/callback' },
    { name: 'NHIS Portal', desc: 'National Health Insurance Service', redirect: 'https://nhis.gov.gh/callback' },
  ];

  clients.forEach(c => {
    const clientId = 'gp_' + uuidv4().replace(/-/g, '').substring(0, 16);
    const clientSecret = 'gps_' + uuidv4().replace(/-/g, '');
    db.prepare(`INSERT INTO oauth_clients (id, client_id, client_secret, name, description, redirect_uris, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), clientId, clientSecret, c.name, c.desc, c.redirect, adminId);
  });

  // Sample audit logs
  const actions = ['user.login', 'user.register', 'identity.verify', 'document.sign', 'sim.verify', 'consent.grant'];
  for (let i = 0; i < 20; i++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    db.prepare(`INSERT INTO audit_logs (id, user_id, action, resource, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))`)
      .run(uuidv4(), userId, action, 'system', '192.168.1.' + Math.floor(Math.random() * 255), Math.floor(Math.random() * 720));
  }

  // Sample login activity
  const devices = ['Chrome on Windows', 'Safari on iPhone', 'Firefox on Ubuntu', 'Chrome on Android'];
  const locations = ['Accra, Ghana', 'Kumasi, Ghana', 'Tamale, Ghana', 'Cape Coast, Ghana', 'Takoradi, Ghana'];
  for (let i = 0; i < 30; i++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    db.prepare(`INSERT INTO login_activity (id, user_id, action, device, browser, ip_address, location, success, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))`)
      .run(uuidv4(), userId, 'login', devices[Math.floor(Math.random() * devices.length)],
        'Mozilla/5.0', '192.168.1.' + Math.floor(Math.random() * 255),
        locations[Math.floor(Math.random() * locations.length)],
        Math.random() > 0.1 ? 1 : 0, Math.floor(Math.random() * 720));
  }

  // Sample fraud alerts
  const fraudTypes = ['multiple_failed_logins', 'suspicious_device', 'identity_mismatch', 'unusual_location'];
  for (let i = 0; i < 5; i++) {
    db.prepare(`INSERT INTO fraud_alerts (id, user_id, alert_type, severity, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))`)
      .run(uuidv4(), userIds[Math.floor(Math.random() * userIds.length)],
        fraudTypes[Math.floor(Math.random() * fraudTypes.length)],
        ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        'Automated fraud detection alert',
        ['open', 'investigating'][Math.floor(Math.random() * 2)],
        Math.floor(Math.random() * 168));
  }

  // Sample consent records
  const oauthClients = db.prepare('SELECT client_id FROM oauth_clients').all();
  userIds.slice(0, 3).forEach(userId => {
    oauthClients.slice(0, 2).forEach(client => {
      db.prepare(`INSERT INTO consent_records (id, user_id, client_id, scopes, granted, created_at)
        VALUES (?, ?, ?, ?, 1, datetime('now', '-' || ? || ' days'))`)
        .run(uuidv4(), userId, client.client_id, 'openid profile', Math.floor(Math.random() * 90));
    });
  });

  // Sample SIM verifications
  userIds.slice(0, 3).forEach(userId => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    db.prepare(`INSERT INTO sim_verifications (id, phone_number, user_id, provider, ghana_card_number, status, verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, 'verified', datetime('now'), datetime('now', '-' || ? || ' days'))`)
      .run(uuidv4(), user.phone, userId, ['MTN', 'Telecel', 'AirtelTigo'][Math.floor(Math.random() * 3)],
        user.ghana_card_number, Math.floor(Math.random() * 30));
  });

  console.log('✅ Database seeded with sample data');
}

module.exports = { db, initializeDatabase };
