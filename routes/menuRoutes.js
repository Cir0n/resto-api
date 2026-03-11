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

router.get("/:categoryId", async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const [menuItems] = await pool.query(
      "SELECT id, name, description, price FROM menu_items INNER JOIN category_menu_items on category_menu_items.menu_items_id = menu_items.id  where category_id = ?",
      [categoryId],
    );
    if (!menuItems[0]) throw new Error("Cette catégorie n'existe pas.");
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;