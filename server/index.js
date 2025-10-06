// Import and initialize
const express = require('express');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const session = require('express-session');
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'ict_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true if using HTTPS
    maxAge: 60 * 60 * 1000 // 1 hour in milliseconds
  }
}));
app.use(express.static(path.join(__dirname, '../client/build')));

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create tables if they don't exist
const createTables = () => {
  pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user'
  )`);

  pool.query(`CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    asset_no VARCHAR(50) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    serial_no VARCHAR(50),
    manufacturer VARCHAR(50),
    model VARCHAR(50),
    version VARCHAR(50),
    status VARCHAR(20) NOT NULL
  )`);

  pool.query(`CREATE TABLE IF NOT EXISTS maintenance (
    id SERIAL PRIMARY KEY,
    date VARCHAR(20) NOT NULL,
    equipment VARCHAR(50) NOT NULL,
    tagnumber VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    equipment_model VARCHAR(50) NOT NULL,
    "user" VARCHAR(50) NOT NULL
  )`);
};

createTables();

// Helper validation functions
function isValidString(val, min = 1, max = 50) {
  return typeof val === 'string' && val.length >= min && val.length <= max;
}
function isValidUsername(val) {
  return typeof val === 'string' && /^[a-zA-Z0-9]{3,20}$/.test(val);
}
function isValidPassword(val) {
  return typeof val === 'string' && val.length >= 6 && val.length <= 50;
}

// User registration
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  // Username: 3-20 chars, alphanumeric only
  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters' });
  }
  // Password: 6-50 chars
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: 'Password must be 6-50 characters' });
  }
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hash, role || 'user']
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ error: 'Username already exists' });
    }
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// User login (simple, no JWT yet)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: 'Invalid password format' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required' });
  }
  next();
}

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Inventory CRUD
app.get('/api/inventory', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Item not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory', requireLogin, async (req, res) => {
  const { asset_no, asset_type, serial_no, manufacturer, model, version, status } = req.body;
  if (!asset_no || typeof asset_no !== 'string' || asset_no.length < 1 || asset_no.length > 50) {
    return res.status(400).json({ error: 'Invalid asset_no' });
  }
  if (!asset_type || typeof asset_type !== 'string' || asset_type.length < 1 || asset_type.length > 50) {
    return res.status(400).json({ error: 'Invalid asset_type' });
  }
  if (serial_no && typeof serial_no !== 'string') {
    return res.status(400).json({ error: 'Invalid serial_no' });
  }
  if (manufacturer && typeof manufacturer !== 'string') {
    return res.status(400).json({ error: 'Invalid manufacturer' });
  }
  if (model && typeof model !== 'string') {
    return res.status(400).json({ error: 'Invalid model' });
  }
  if (version && typeof version !== 'string') {
    return res.status(400).json({ error: 'Invalid version' });
  }
  if (!status || typeof status !== 'string' || status.length < 1 || status.length > 20) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO inventory (asset_no, asset_type, serial_no, manufacturer, model, version, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [asset_no, asset_type, serial_no, manufacturer, model, version, status]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { asset_no, asset_type, serial_no, manufacturer, model, version, status } = req.body;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }
  if (!asset_no || typeof asset_no !== 'string' || asset_no.length < 1 || asset_no.length > 50) {
    return res.status(400).json({ error: 'Invalid asset_no' });
  }
  if (!asset_type || typeof asset_type !== 'string' || asset_type.length < 1 || asset_type.length > 50) {
    return res.status(400).json({ error: 'Invalid asset_type' });
  }
  if (serial_no && typeof serial_no !== 'string') {
    return res.status(400).json({ error: 'Invalid serial_no' });
  }
  if (manufacturer && typeof manufacturer !== 'string') {
    return res.status(400).json({ error: 'Invalid manufacturer' });
  }
  if (model && typeof model !== 'string') {
    return res.status(400).json({ error: 'Invalid model' });
  }
  if (version && typeof version !== 'string') {
    return res.status(400).json({ error: 'Invalid version' });
  }
  if (!status || typeof status !== 'string' || status.length < 1 || status.length > 20) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const result = await pool.query(
      'UPDATE inventory SET asset_no = $1, asset_type = $2, serial_no = $3, manufacturer = $4, model = $5, version = $6, status = $7 WHERE id = $8 RETURNING *',
      [asset_no, asset_type, serial_no, manufacturer, model, version, status, id]
    );
    res.json({ updated: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/inventory/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }
  try {
    const result = await pool.query('DELETE FROM inventory WHERE id = $1', [id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// MAINTENANCE ENDPOINTS
app.get('/api/maintenance', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/maintenance/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid maintenance ID' });
  }
  try {
    const result = await pool.query('SELECT * FROM maintenance WHERE id = $1', [id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Record not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance', requireLogin, async (req, res) => {
  const { date, equipment, tagnumber, department, equipment_model, user } = req.body;
  if (!date || typeof date !== 'string' || date.length < 4 || date.length > 20) {
    return res.status(400).json({ error: 'Invalid date' });
  }
  if (!equipment || typeof equipment !== 'string' || equipment.length < 1 || equipment.length > 50) {
    return res.status(400).json({ error: 'Invalid equipment' });
  }
  if (!tagnumber || typeof tagnumber !== 'string' || tagnumber.length < 1 || tagnumber.length > 50) {
    return res.status(400).json({ error: 'Invalid tagnumber' });
  }
  if (!department || typeof department !== 'string' || department.length < 1 || department.length > 50) {
    return res.status(400).json({ error: 'Invalid department' });
  }
  if (!equipment_model || typeof equipment_model !== 'string' || equipment_model.length < 1 || equipment_model.length > 50) {
    return res.status(400).json({ error: 'Invalid equipment_model' });
  }
  if (!user || typeof user !== 'string' || user.length < 1 || user.length > 50) {
    return res.status(400).json({ error: 'Invalid user' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO maintenance (date, equipment, tagnumber, department, equipment_model, user) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [date, equipment, tagnumber, department, equipment_model, user]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/maintenance/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { date, equipment, tagnumber, department, equipment_model, user } = req.body;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid maintenance ID' });
  }
  if (!date || typeof date !== 'string' || date.length < 4 || date.length > 20) {
    return res.status(400).json({ error: 'Invalid date' });
  }
  if (!equipment || typeof equipment !== 'string' || equipment.length < 1 || equipment.length > 50) {
    return res.status(400).json({ error: 'Invalid equipment' });
  }
  if (!tagnumber || typeof tagnumber !== 'string' || tagnumber.length < 1 || tagnumber.length > 50) {
    return res.status(400).json({ error: 'Invalid tagnumber' });
  }
  if (!department || typeof department !== 'string' || department.length < 1 || department.length > 50) {
    return res.status(400).json({ error: 'Invalid department' });
  }
  if (!equipment_model || typeof equipment_model !== 'string' || equipment_model.length < 1 || equipment_model.length > 50) {
    return res.status(400).json({ error: 'Invalid equipment_model' });
  }
  if (!user || typeof user !== 'string' || user.length < 1 || user.length > 50) {
    return res.status(400).json({ error: 'Invalid user' });
  }
  try {
    const result = await pool.query(
      'UPDATE maintenance SET date = $1, equipment = $2, tagnumber = $3, department = $4, equipment_model = $5, user = $6 WHERE id = $7 RETURNING *',
      [date, equipment, tagnumber, department, equipment_model, user, id]
    );
    res.json({ updated: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/maintenance/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid maintenance ID' });
  }
  try {
    const result = await pool.query('DELETE FROM maintenance WHERE id = $1', [id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reports endpoint (protected)
app.get('/api/reports', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List users (for admin)
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logout', requireLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/', (req, res) => {
  res.send('ICT Inventory & Maintenance API running');
});

// Serve React frontend for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
