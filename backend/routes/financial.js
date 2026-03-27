const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticateToken, auditLog } = require('../middleware/auth');

// Partner banks data
const PARTNER_BANKS = [
  { id: 'gcb', name: 'GCB Bank', code: 'GCB', swift: 'GHCBGHAC', branches: ['Accra Main', 'Kumasi', 'Tamale', 'Cape Coast', 'Takoradi'], color: '#003DA5', logo: '/logos/gcb.png' },
  { id: 'stanbic', name: 'Stanbic Bank', code: 'STANBIC', swift: 'SBICGHAC', branches: ['Airport City', 'Osu', 'Kumasi Adum', 'Tema'], color: '#0033A0', logo: '/logos/stanbic.png' },
  { id: 'ecobank', name: 'Ecobank Ghana', code: 'ECO', swift: 'ABORGH01', branches: ['Accra Central', 'Ring Road', 'Kumasi', 'Takoradi', 'Ho'], color: '#00529B', logo: '/logos/ecobank.png' },
  { id: 'stanchart', name: 'Standard Chartered', code: 'SCB', swift: 'SCBLGHAC', branches: ['High Street Accra', 'Osu Oxford', 'Kumasi'], color: '#0072AA', logo: '/logos/stanchart.png' },
  { id: 'absa', name: 'Absa Bank Ghana', code: 'ABSA', swift: 'BABORGH1', branches: ['Accra Main', 'Achimota', 'Kumasi Prempeh', 'Tema'], color: '#AF0C0F', logo: '/logos/absa.png' },
  { id: 'fidelity', name: 'Fidelity Bank', code: 'FBG', swift: 'FBLIGHAC', branches: ['Ridge Accra', 'Madina', 'Kumasi Adum', 'Sunyani'], color: '#00427A', logo: '/logos/fidelity.png' },
  { id: 'calbank', name: 'CalBank', code: 'CAL', swift: 'ACABORGH', branches: ['Head Office Accra', 'Tema', 'Kumasi', 'Takoradi'], color: '#006341', logo: '/logos/calbank.png' },
  { id: 'bog', name: 'Bank of Ghana', code: 'BOG', swift: 'BAABORGH', branches: ['Head Office Accra', 'Kumasi', 'Tamale'], color: '#1B3A5C', logo: '/logos/bog.png' },
];

// GET /api/financial/banks — List partner banks
router.get('/banks', authenticateToken, (req, res) => {
  res.json({
    banks: PARTNER_BANKS.map(b => ({
      id: b.id,
      name: b.name,
      code: b.code,
      swift: b.swift,
      branches: b.branches,
      account_types: ['savings', 'current', 'fixed_deposit'],
      color: b.color,
      logo: b.logo
    })),
    total: PARTNER_BANKS.length
  });
});

// POST /api/financial/open-account — Open a mock bank account
router.post('/open-account', authenticateToken, (req, res) => {
  try {
    const { bank_id, account_type, branch } = req.body;

    if (!bank_id || !account_type) {
      return res.status(400).json({ error: 'Bank ID and account type are required' });
    }

    const bank = PARTNER_BANKS.find(b => b.id === bank_id);
    if (!bank) {
      return res.status(400).json({ error: 'Invalid bank ID' });
    }

    const validTypes = ['savings', 'current', 'fixed_deposit'];
    if (!validTypes.includes(account_type)) {
      return res.status(400).json({ error: 'Invalid account type. Must be: savings, current, or fixed_deposit' });
    }

    // Check user is verified
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate mock account number (13 digits) and IBAN
    const accountNumber = bank.code.substring(0, 3).toUpperCase() +
      Date.now().toString().slice(-7) +
      Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const iban = `GH${Math.floor(10 + Math.random() * 90)}${bank.swift.substring(0, 4)}${accountNumber}`;

    const accountId = uuidv4();

    db.prepare(`INSERT INTO bank_accounts (id, user_id, bank_name, bank_code, account_number, account_type, branch, iban, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`)
      .run(accountId, req.user.id, bank.name, bank.code, accountNumber, account_type, branch || bank.branches[0], iban);

    auditLog(req, 'financial.open_account', 'bank_accounts', accountId, {
      bank: bank.name, account_type, branch: branch || bank.branches[0]
    });

    res.json({
      success: true,
      account: {
        id: accountId,
        bank_name: bank.name,
        bank_code: bank.code,
        account_number: accountNumber,
        account_type,
        branch: branch || bank.branches[0],
        iban,
        swift: bank.swift,
        status: 'active',
        holder_name: user.full_name,
        ghana_card: user.ghana_card_number,
        opened_at: new Date().toISOString()
      },
      message: `${account_type.replace('_', ' ')} account successfully opened with ${bank.name}`
    });
  } catch (err) {
    console.error('Account opening error:', err);
    res.status(500).json({ error: 'Failed to open account' });
  }
});

// GET /api/financial/accounts — Get user's bank accounts
router.get('/accounts', authenticateToken, (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user.id);

    res.json({
      accounts,
      total: accounts.length
    });
  } catch (err) {
    console.error('Fetch accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

module.exports = router;
