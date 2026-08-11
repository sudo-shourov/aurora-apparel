const express = require('express');
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'aurora-super-secret-key-2026';

// Initialize Turso client dynamically using environment variables
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Lazy DB initialization helper
let tableInitialized = false;
async function ensureDB() {
  if (tableInitialized) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    tableInitialized = true;
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Middleware ensuring DB initialization on incoming API requests
app.use(async (req, res, next) => {
  await ensureDB();
  next();
});

// Password Validation Helper
const validatePassword = (password) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
};

// Sign Up Route
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
    });
  }

  try {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ? OR email = ?',
      args: [cleanUsername, cleanEmail]
    });

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.execute({
      sql: 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      args: [cleanUsername, cleanEmail, hashedPassword]
    });

    const token = jwt.sign(
      { id: Number(result.lastInsertRowid), username: cleanUsername },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      username: cleanUsername
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const cleanUser = username.trim().toLowerCase();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ? OR email = ?',
      args: [cleanUser, cleanUser]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: Number(user.id), username: String(user.username) },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Logged in successfully!',
      token,
      username: String(user.username)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = app;