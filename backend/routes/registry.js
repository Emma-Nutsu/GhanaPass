const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/registry/lookup/:card_number — Lookup Ghana Card in dummy NIA database
router.get('/lookup/:card_number', (req, res) => {
  try {
    const { card_number } = req.params;

    if (!card_number) {
      return res.status(400).json({ error: 'Ghana Card number required' });
    }

    const citizen = db.prepare('SELECT * FROM ghana_card_registry WHERE card_number = ?').get(card_number);

    if (!citizen) {
      return res.status(404).json({
        error: 'Invalid Ghana Card Number. Cannot create account.',
        found: false
      });
    }

    // Check if already registered in the system
    const existingUser = db.prepare('SELECT id FROM users WHERE ghana_card_number = ?').get(card_number);

    res.json({
      found: true,
      already_registered: !!existingUser,
      citizen: {
        card_number: citizen.card_number,
        full_name: citizen.full_name,
        date_of_birth: citizen.date_of_birth,
        gender: citizen.gender,
        region: citizen.region,
        phone: citizen.phone
      }
    });
  } catch (err) {
    console.error('Registry lookup error:', err);
    res.status(500).json({ error: 'Registry lookup failed' });
  }
});

module.exports = router;
