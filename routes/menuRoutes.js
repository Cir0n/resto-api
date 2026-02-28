const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [menuItems] = await pool.query('SELECT id, name, description, price FROM menu_items');
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;