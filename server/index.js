// Import and initialize
const express = require('express');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const sqlite3 = require('sqlite3').verbose();
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

// SQLite setup
const dbPath = path.join(__dirname, 'ict_inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Ensure the server starts
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Create tables if they don't exist
const createTables = () => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_no TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    serial_no TEXT,
    manufacturer TEXT,
    model TEXT,
    version TEXT,
    status TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    equipment TEXT NOT NULL,
    tagnumber TEXT NOT NULL,
    department TEXT NOT NULL,
    equipment_model TEXT NOT NULL,
    user TEXT NOT NULL
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
  console.log('Register request body:', req.body);
  // Username: 3-20 chars, alphanumeric only
  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters' });
  }
  // Password: 6-50 chars
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: 'Password must be 6-50 characters' });
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  console.log('Password hash:', hash);
  db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hash, role || 'user'],
    function(err) {
      if (err) {
        console.error('Registration DB error:', err);
        if (err.message && err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Registration failed' });
      }
      // Log the inserted user id
      console.log('Inserted user id:', this.lastID);
      db.get('SELECT id, username, role FROM users WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) {
          console.error('Fetch after insert error:', err2);
          return res.status(500).json({ error: 'Registration failed' });
        }
        res.json(row);
      });
    }
  );
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
  // LOGIN HANDLER
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

} catch (err) {
  console.error('Login error:', err);
  return res.status(500).json({ error: 'Login failed' });
}


// REGISTRATION HANDLER
try {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  console.log('Password hash:', hash);

  db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hash, role || 'user'],
    function (err) {
      if (err) {
        console.error('Registration DB error:', err);
        if (err.message && err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Registration failed' });
      }

      db.get('SELECT id, username, role FROM users WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) {
          console.error('Fetch after insert error:', err2);
          return res.status(500).json({ error: 'Registration failed' });
        }
        res.json(row);
      });
    }
  );

} catch (err) {
  console.error('Registration error:', err);
  return res.status(500).json({ error: 'Registration failed' });
}
// Inventory CRUD
app.get('/api/inventory', requireLogin, (req, res) => {
  db.all('SELECT * FROM inventory', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/inventory/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }
  db.get('SELECT * FROM inventory WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) return res.status(404).json({ error: 'Item not found' });
    res.json(row);
  });
});

app.post('/api/inventory', requireLogin, (req, res) => {
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
  db.run(
    'INSERT INTO inventory (asset_no, asset_type, serial_no, manufacturer, model, version, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [asset_no, asset_type, serial_no, manufacturer, model, version, status],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
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

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: 'Invalid password format' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error('Login DB error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ id: user.id, username: user.username, role: user.role });
  });
});
