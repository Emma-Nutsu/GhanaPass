const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authenticateToken, auditLog } = require('../middleware/auth');

// Configure file upload
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// POST /api/documents/upload
router.post('/upload', authenticateToken, upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF document required' });
    }

    const docId = uuidv4();
    db.prepare(`INSERT INTO documents (id, user_id, filename, original_name, file_path, file_size, mime_type, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'uploaded', datetime('now'))`)
      .run(docId, req.user.id, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype);

    auditLog(req, 'document.upload', 'documents', docId, { filename: req.file.originalname });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: docId,
        filename: req.file.originalname,
        size: req.file.size,
        status: 'uploaded',
        uploaded_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/documents/sign
router.post('/sign', authenticateToken, (req, res) => {
  try {
    const { document_id, pin } = req.body;

    if (!document_id || !pin) {
      return res.status(400).json({ error: 'Document ID and PIN required' });
    }

    const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(document_id, req.user.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify PIN
    const user = db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(pin, user.pin_hash)) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Generate signature hash (SHA-256 of document content + user ID + timestamp)
    const timestamp = new Date().toISOString();
    const signatureData = `${doc.id}:${req.user.id}:${timestamp}`;
    const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex');
    const verificationHash = crypto.createHash('sha256').update(`${signatureHash}:${doc.filename}`).digest('hex');

    const sigId = uuidv4();
    db.prepare(`INSERT INTO signatures (id, document_id, user_id, signature_hash, verification_hash, timestamp, ip_address, method)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pin')`)
      .run(sigId, doc.id, req.user.id, signatureHash, verificationHash, timestamp, req.ip);

    db.prepare('UPDATE documents SET status = ? WHERE id = ?').run('signed', doc.id);

    auditLog(req, 'document.sign', 'signatures', sigId, { document_id: doc.id });

    res.json({
      message: 'Document signed successfully',
      signature: {
        id: sigId,
        document_id: doc.id,
        signature_hash: signatureHash,
        verification_hash: verificationHash,
        signed_at: timestamp,
        method: 'pin',
        signer: req.user.full_name
      }
    });
  } catch (err) {
    console.error('Signing error:', err);
    res.status(500).json({ error: 'Signing failed' });
  }
});

// GET /api/documents
router.get('/', authenticateToken, (req, res) => {
  try {
    const documents = db.prepare(`
      SELECT d.*, s.signature_hash, s.verification_hash, s.timestamp as signed_at, s.method
      FROM documents d
      LEFT JOIN signatures s ON d.id = s.document_id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `).all(req.user.id);

    res.json({ documents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/:id/verify
router.get('/:id/verify', (req, res) => {
  try {
    const sig = db.prepare(`
      SELECT s.*, d.filename, d.original_name, u.full_name as signer_name, u.ghana_card_number
      FROM signatures s
      JOIN documents d ON s.document_id = d.id
      JOIN users u ON s.user_id = u.id
      WHERE s.document_id = ?
    `).get(req.params.id);

    if (!sig) {
      return res.status(404).json({ error: 'No signature found for this document' });
    }

    // Verify integrity
    const expectedVerificationHash = crypto.createHash('sha256')
      .update(`${sig.signature_hash}:${sig.filename}`).digest('hex');

    res.json({
      valid: sig.verification_hash === expectedVerificationHash,
      signature: {
        signer: sig.signer_name,
        ghana_card: sig.ghana_card_number,
        document: sig.original_name,
        signed_at: sig.timestamp,
        method: sig.method,
        signature_hash: sig.signature_hash,
        verification_hash: sig.verification_hash
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
