
// Import and initialize
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL,
    status TEXT NOT NULL,
    received_date TEXT,
    sent_for_repair_date TEXT,
    returned_date TEXT,
    repair_status TEXT,
    notes TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    floor TEXT NOT NULL,
    maintenance_date TEXT NOT NULL,
    details TEXT
  )`);
};

createTables();

// User registration
app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, password, role || 'user'],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.json({ id: this.lastID, username, role: role || 'user' });
    }
  );
});

// User login (simple, no JWT yet)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json({ id: user.id, username: user.username, role: user.role });
    }
  );
});

// List users (for admin)
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, role FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Inventory CRUD
app.get('/api/inventory', (req, res) => {
  db.all('SELECT * FROM inventory', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/inventory/:id', (req, res) => {
  db.get('SELECT * FROM inventory WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Item not found' });
    res.json(row);
  });
});

app.post('/api/inventory', (req, res) => {
  const { item_name, item_type, status, received_date, sent_for_repair_date, returned_date, repair_status, notes } = req.body;
  db.run(
    `INSERT INTO inventory (item_name, item_type, status, received_date, sent_for_repair_date, returned_date, repair_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [item_name, item_type, status, received_date, sent_for_repair_date, returned_date, repair_status, notes],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/inventory/:id', (req, res) => {
  const { item_name, item_type, status, received_date, sent_for_repair_date, returned_date, repair_status, notes } = req.body;
  db.run(
    `UPDATE inventory SET item_name = ?, item_type = ?, status = ?, received_date = ?, sent_for_repair_date = ?, returned_date = ?, repair_status = ?, notes = ? WHERE id = ?`,
    [item_name, item_type, status, received_date, sent_for_repair_date, returned_date, repair_status, notes, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/inventory/:id', (req, res) => {
  db.run('DELETE FROM inventory WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Maintenance CRUD
app.get('/api/maintenance', (req, res) => {
  db.all('SELECT * FROM maintenance', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/maintenance/:id', (req, res) => {
  db.get('SELECT * FROM maintenance WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Record not found' });
    res.json(row);
  });
});

app.post('/api/maintenance', (req, res) => {
  const { floor, maintenance_date, details } = req.body;
  db.run(
    `INSERT INTO maintenance (floor, maintenance_date, details) VALUES (?, ?, ?)`,
    [floor, maintenance_date, details],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/maintenance/:id', (req, res) => {
  const { floor, maintenance_date, details } = req.body;
  db.run(
    `UPDATE maintenance SET floor = ?, maintenance_date = ?, details = ? WHERE id = ?`,
    [floor, maintenance_date, details, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/maintenance/:id', (req, res) => {
  db.run('DELETE FROM maintenance WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.get('/', (req, res) => {
  res.send('ICT Inventory & Maintenance API running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
