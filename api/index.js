const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'aurora-super-secret-key-2026';

// Direct HTTP SQL Executor for Turso
async function executeSql(sql, args = []) {
  let rawUrl = process.env.TURSO_DATABASE_URL || '';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!rawUrl || !authToken) {
    throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment variables.');
  }

  // Ensure HTTPS format for HTTP API calls
  let baseUrl = rawUrl.replace(/^libsql:\/\//, 'https://');
  if (!baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/$/, '');

  const response = await fetch(`${baseUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          type: 'execute',
          stmt: {
            sql: sql,
            args: args.map(arg => {
              if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
              if (typeof arg === 'string') return { type: 'text', value: arg };
              if (arg === null) return { type: 'null' };
              return { type: 'text', value: String(arg) };
            })
          }
        },
        { type: 'close' }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Turso request failed with status ${response.status}`);
  }

  const result = data.results?.[0]?.response?.result;
  if (!result) {
    const errorMsg = data.results?.[0]?.error?.message || 'Database query error';
    throw new Error(errorMsg);
  }

  // Format rows into plain JS objects
  const columns = result.cols.map(col => col.name);
  const rows = result.rows.map(row => {
    const obj = {};
    row.forEach((cell, idx) => {
      obj[columns[idx]] = cell.value;
    });
    return obj;
  });

  return {
    rows,
    lastInsertRowid: result.last_insert_rowid
  };
}

// Ensure table exists on request
let tableInitialized = false;
async function ensureTableExists() {
  if (tableInitialized) return;
  await executeSql(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  tableInitialized = true;
}

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
    return res.status(400).json({ error: 'Password rules not met.' });
  }

  try {
    await ensureTableExists();

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await executeSql(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await executeSql(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [cleanUsername, cleanEmail, hashedPassword]
    );

    const userId = result.lastInsertRowid ? String(result.lastInsertRowid) : cleanUsername;

    const token = jwt.sign(
      { id: userId, username: cleanUsername },
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
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    await ensureTableExists();

    const cleanUser = username.trim().toLowerCase();
    const result = await executeSql(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [cleanUser, cleanUser]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: String(user.id), username: String(user.username) },
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
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

module.exports = app;