const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const pool = require('../config/db');

router.post('/signup', async (req, res) =>{
    const { email, password, fname, lname, phone } = req.body;

    if(typeof email !== 'string' || email.trim() === '' || typeof password !== 'string' || password.trim().length < 6){
        return res.status(400).json({error: 'Invalid email or password'});
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        const [result] = await pool.query('INSERT INTO users (email, password_hash, fname, lname, phone) VALUES (?, ?, ?, ?, ?)', [email, hash, fname, lname, phone]);

        res.status(201).json({message: 'User created successfully', userId: result.insertId});
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({error: 'Internal server error'});
}})

router.post('/login', async (req, res) =>{
    const { email, password } = req.body;
    
    if(typeof email !== 'string' || typeof password !== 'string'){
        return res.status(400).json({error: 'Invalid email or password'});
    }

    try {
        const[rows] = await pool.query('SELECT id, password_hash, role FROM users WHERE email = ?', [email]);

        if(rows.length === 0){
            return res.status(401).json({error: 'Invalid email or password'});
        }

        const { id, password_hash, role } = rows[0];
        const valid = await bcrypt.compare(password, password_hash);

        if(!valid){
            return res.status(401).json({error: 'Invalid email or password'});
        }

        const token = jwt.sign({ userId: id, role: role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal server error'});

    }
})


module.exports = router;
