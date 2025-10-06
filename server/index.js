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

// Database setup
const dbPath = path.join(__dirname, 'ict_inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
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
app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;
  // Username: 3-20 chars, alphanumeric only
  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters' });
  }
  // Password: 6-50 chars
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: 'Password must be 6-50 characters' });
  }
  bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }
    db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hash, role || 'user'],
      function (err) {
        if (err) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        res.json({ id: this.lastID, username, role: role || 'user' });
      }
    );
  });
});

// User login (simple, no JWT yet)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 50) {
    return res.status(400).json({ error: 'Invalid password format' });
  }
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Store user info in session
        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.json({ id: user.id, username: user.username, role: user.role });
      });
    }
  );
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
app.get('/api/inventory', requireLogin, (req, res) => {
  // No input to validate
  db.all('SELECT * FROM inventory', [], (err, rows) => {
    if (err) {
      console.error('Error fetching inventory:', err.message);
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
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Item not found' });
    res.json(row);
  });
});

app.post('/api/inventory', requireLogin, (req, res) => {
  const { asset_no, asset_type, serial_no, manufacturer, model, version, status } = req.body;
  if (!isValidString(asset_no) || !isValidString(asset_type) || !isValidString(status, 1, 20)) {
    return res.status(400).json({ error: 'Invalid asset_no, asset_type, or status' });
  }
  if (serial_no && !isValidString(serial_no)) {
    return res.status(400).json({ error: 'Invalid serial_no' });
  }
  if (manufacturer && !isValidString(manufacturer)) {
    return res.status(400).json({ error: 'Invalid manufacturer' });
  }
  if (model && !isValidString(model)) {
    return res.status(400).json({ error: 'Invalid model' });
  }
  if (version && !isValidString(version)) {
    return res.status(400).json({ error: 'Invalid version' });
  }
  db.run(
    `INSERT INTO inventory (asset_no, asset_type, serial_no, manufacturer, model, version, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [asset_no, asset_type, serial_no, manufacturer, model, version, status],
    function (err) {
      if (err) {
        console.error('Error inserting inventory:', err.message, req.body);
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/inventory/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  const { asset_no, asset_type, serial_no, manufacturer, model, version, status } = req.body;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }
  if (!isValidString(asset_no) || !isValidString(asset_type) || !isValidString(status, 1, 20)) {
    return res.status(400).json({ error: 'Invalid asset_no, asset_type, or status' });
  }
  if (serial_no && !isValidString(serial_no)) {
    return res.status(400).json({ error: 'Invalid serial_no' });
  }
  if (manufacturer && !isValidString(manufacturer)) {
    return res.status(400).json({ error: 'Invalid manufacturer' });
  }
  if (model && !isValidString(model)) {
    return res.status(400).json({ error: 'Invalid model' });
  }
  if (version && !isValidString(version)) {
    return res.status(400).json({ error: 'Invalid version' });
  }
  db.run(
    `UPDATE inventory SET asset_no = ?, asset_type = ?, serial_no = ?, manufacturer = ?, model = ?, version = ?, status = ? WHERE id = ?`,
    [asset_no, asset_type, serial_no, manufacturer, model, version, status, id],
    function (err) {
      if (err) {
        console.error('Error updating inventory:', err.message);
        return res.status(400).json({ error: err.message });
      }
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/inventory/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }
  db.run('DELETE FROM inventory WHERE id = ?', [id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Maintenance CRUD
app.get('/api/maintenance', requireLogin, (req, res) => {
  db.all('SELECT * FROM maintenance', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/maintenance/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid maintenance ID' });
  }
  db.get('SELECT * FROM maintenance WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Record not found' });
    res.json(row);
  });
});

app.post('/api/maintenance', requireLogin, (req, res) => {
  const { date, equipment, tagnumber, department, equipment_model, user } = req.body;
  if (!isValidString(date, 4, 20) || !isValidString(equipment) || !isValidString(tagnumber) || !isValidString(department) || !isValidString(equipment_model) || !isValidString(user)) {
    return res.status(400).json({ error: 'Invalid maintenance fields' });
  }
  db.run(
    `INSERT INTO maintenance (date, equipment, tagnumber, department, equipment_model, user) VALUES (?, ?, ?, ?, ?, ?)`,
    [date, equipment, tagnumber, department, equipment_model, user],
    function (err) {
      if (err) {
        console.error('Error inserting maintenance:', err.message, req.body);
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/maintenance/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  const { date, equipment, tagnumber, department, equipment_model, user } = req.body;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid maintenance ID' });
  }
  if (!isValidString(date, 4, 20) || !isValidString(equipment) || !isValidString(tagnumber) || !isValidString(department) || !isValidString(equipment_model) || !isValidString(user)) {
    return res.status(400).json({ error: 'Invalid maintenance fields' });
  }
  db.run(
    `UPDATE maintenance SET date = ?, equipment = ?, tagnumber = ?, department = ?, equipment_model = ?, user = ? WHERE id = ?`,
    [date, equipment, tagnumber, department, equipment_model, user, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/maintenance/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid maintenance ID' });
  }
  db.run('DELETE FROM maintenance WHERE id = ?', [id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Reports endpoint (protected)
app.get('/api/reports', requireLogin, (req, res) => {
  // No input to validate
  db.all('SELECT * FROM inventory', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// List users (for admin)
app.get('/api/users', requireAdmin, (req, res) => {
  // No input to validate
  db.all('SELECT id, username, role FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
