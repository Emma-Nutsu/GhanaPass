const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initializeDatabase();

// Serve demo integration page BEFORE helmet so inline scripts work
app.use('/demo', express.static(path.join(__dirname, '..', 'demo')));

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (curl, mobile apps, etc.)
    if (!origin || origin === 'null') return callback(null, true);
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000'];
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  }, 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts' }
});
app.use('/api/auth/login', authLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Swagger UI
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ghana Pass API Documentation'
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/sim', require('./routes/sim'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/oauth', require('./routes/oauth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/developer', require('./routes/developer'));
app.use('/api/user', require('./routes/user'));
app.use('/api/financial', require('./routes/financial'));
app.use('/api/registry', require('./routes/registry'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Ghana Pass API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Ghana Pass API',
    version: '1.0.0',
    description: 'National Digital Identity Platform for Ghana',
    documentation: '/api/docs',
    endpoints: {
      auth: { register: 'POST /api/auth/register', login: 'POST /api/auth/login', refresh: 'POST /api/auth/refresh', logout: 'POST /api/auth/logout' },
      verify: { identity: 'POST /api/verify/identity', face: 'POST /api/verify/face' },
      sim: { verify: 'POST /api/sim/verify' },
      documents: { upload: 'POST /api/documents/upload', sign: 'POST /api/documents/sign', list: 'GET /api/documents', verify: 'GET /api/documents/:id/verify' },
      oauth: { authorize: 'GET /api/oauth/authorize', token: 'POST /api/oauth/token', userinfo: 'GET /api/oauth/userinfo' },
      user: { profile: 'GET /api/user/profile', activity: 'GET /api/user/activity', consents: 'GET /api/user/consents' },
      financial: { banks: 'GET /api/financial/banks', openAccount: 'POST /api/financial/open-account', accounts: 'GET /api/financial/accounts' },
      admin: { stats: 'GET /api/admin/stats', users: 'GET /api/admin/users', verifications: 'GET /api/admin/verifications', fraud: 'GET /api/admin/fraud' },
      developer: { apps: 'POST /api/developer/apps', keys: 'POST /api/developer/apps/:id/keys', webhooks: 'POST /api/developer/webhooks' }
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║          🇬🇭 Ghana Pass API Server           ║
  ║                                              ║
  ║  API:     http://localhost:${PORT}             ║
  ║  Docs:    http://localhost:${PORT}/api/docs    ║
  ║  Health:  http://localhost:${PORT}/api/health  ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
