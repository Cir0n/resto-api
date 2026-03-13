const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {

    const { category, max_price } = req.query;

    let query = `
        SELECT mi.id, mi.name, mi.description, mi.price
        FROM menu_items mi
        JOIN category_menu_items cmi ON cmi.menu_items_id = mi.id
        JOIN category c ON c.id = cmi.category_id
        WHERE 1=1
    `;

    const params = [];

    if (category) {
        query += " AND c.name = ?";
        params.push(category);
    }

    if (max_price) {
        query += " AND mi.price <= ?";
        params.push(max_price);
    }

    try {

        const [menuItems] = await pool.query(query, params);

        res.json(menuItems);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});

module.exports = router;