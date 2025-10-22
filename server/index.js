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
    secure: false,
    maxAge: 60 * 60 * 1000
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

// Create tables if they don't exist and seed departments, then start server
const createTables = (cb) => {
  db.serialize(() => {
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
      os_info TEXT,
      status TEXT NOT NULL,
      department TEXT NOT NULL
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

    db.run(`CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      from_department TEXT NOT NULL,
      to_department TEXT NOT NULL,
      destination TEXT,
      sent_by TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Sent',
      notes TEXT,
      records_received_by TEXT,
      records_received_at TEXT,
      records_notes TEXT,
      shipped_by TEXT,
      shipped_at TEXT,
      tracking_info TEXT,
      destination_received_by TEXT,
      destination_received_at TEXT,
      FOREIGN KEY (inventory_id) REFERENCES inventory(id)
    )`);

    // Departments table
    db.run(`CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`);

    // Seed default departments if not present
    const defaultDepts = ['BANK','CENTRAL OPERATIONS','CUSTOMER EXPERIENCE','RECORDS','FINANCE','REGISTRY','HR','CREDIT & LOANS','AUDITING'];
    defaultDepts.forEach(d => {
      db.run('INSERT OR IGNORE INTO departments (name) VALUES (?)', [d]);
    });
    // Asset counters table for sequential asset numbers per department
    db.run(`CREATE TABLE IF NOT EXISTS asset_counters (
      department TEXT UNIQUE NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0
    )`);
  });
  if (typeof cb === 'function') cb();
};

createTables(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

// Ensure os_info column exists on startup (for older DBs)
db.serialize(() => {
  db.all("PRAGMA table_info(inventory)", [], (err, cols) => {
    if (err) {
      console.error('Failed to read inventory table info', err);
      return;
    }
    const hasOs = cols && cols.some(c => c.name === 'os_info');
    if (!hasOs) {
      db.run('ALTER TABLE inventory ADD COLUMN os_info TEXT', (alterErr) => {
        if (alterErr) console.error('Failed to add os_info column:', alterErr.message);
      });
    }
  });
});

// Helper validation functions
function isValidString(val, min = 1, max = 200) {
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
  if (!username || !isValidUsername(username)) return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters' });
  if (!password || !isValidPassword(password)) return res.status(400).json({ error: 'Password must be 6-50 characters' });
  bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
    if (err) {
      console.error('Bcrypt hash error:', err);
      return res.status(500).json({ error: 'Registration failed' });
    }
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role || 'user'], function(err) {
      if (err) {
        console.error('Registration DB error:', err);
        if (err.message && err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username already exists' });
        return res.status(500).json({ error: 'Registration failed' });
      }
      db.get('SELECT id, username, role FROM users WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'Registration failed' });
        res.json(row);
      });
    });
  });
});

// User login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !isValidUsername(username)) return res.status(400).json({ error: 'Invalid username format' });
  if (!password || !isValidPassword(password)) return res.status(400).json({ error: 'Invalid password format' });
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ id: user.id, username: user.username, role: user.role });
  });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'Login required' });
  next();
}

// Inventory CRUD
app.get('/api/inventory', requireLogin, (req, res) => {
  const dept = req.query.department;
  let sql = 'SELECT * FROM inventory';
  const params = [];
  if (dept) { sql += ' WHERE department = ?'; params.push(dept); }
  db.all(sql, params, (err, rows) => { if (err) return res.status(500).json({ error: err.message }); res.json(rows); });
});

app.get('/api/inventory/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid inventory ID' });
  db.get('SELECT * FROM inventory WHERE id = ?', [id], (err, row) => { if (err) return res.status(500).json({ error: err.message }); if (!row) return res.status(404).json({ error: 'Item not found' }); res.json(row); });
});


app.put('/api/inventory/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  const { asset_no, asset_type, serial_no, manufacturer, model, version, os_info, status } = req.body;
  let { department } = req.body || {};
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid inventory ID' });
  if (!asset_no || !isValidString(asset_no,1,50)) return res.status(400).json({ error: 'Invalid asset_no' });
  if (!asset_type || !isValidString(asset_type,1,50)) return res.status(400).json({ error: 'Invalid asset_type' });
  if (serial_no && typeof serial_no !== 'string') return res.status(400).json({ error: 'Invalid serial_no' });
  if (manufacturer && typeof manufacturer !== 'string') return res.status(400).json({ error: 'Invalid manufacturer' });
  if (model && typeof model !== 'string') return res.status(400).json({ error: 'Invalid model' });
  if (version && typeof version !== 'string') return res.status(400).json({ error: 'Invalid version' });
  if (os_info && typeof os_info !== 'string') return res.status(400).json({ error: 'Invalid os_info' });
  if (!status || !isValidString(status,1,20)) return res.status(400).json({ error: 'Invalid status' });
  department = department ? String(department).toUpperCase() : '';
  if (!department || !isValidString(department,1,50)) return res.status(400).json({ error: 'Invalid department' });
  // verify department exists
  db.get('SELECT id FROM departments WHERE name = ?', [department], (dErr, dRow) => {
    if (dErr) return res.status(500).json({ error: dErr.message });
    if (!dRow) return res.status(400).json({ error: 'Department does not exist' });
    db.run('UPDATE inventory SET asset_no = ?, asset_type = ?, serial_no = ?, manufacturer = ?, model = ?, version = ?, os_info = ?, status = ?, department = ? WHERE id = ?', [asset_no, asset_type, serial_no, manufacturer, model, version, os_info || '', status, department, id], function(err) { if (err) return res.status(400).json({ error: err.message }); res.json({ updated: this.changes }); });
  });
});

app.delete('/api/inventory/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid inventory ID' });
  db.run('DELETE FROM inventory WHERE id = ?', [id], function(err) { if (err) return res.status(400).json({ error: err.message }); res.json({ deleted: this.changes }); });
});

// MAINTENANCE ENDPOINTS
app.get('/api/maintenance', requireLogin, (req, res) => { db.all('SELECT * FROM maintenance', [], (err, rows) => { if (err) return res.status(500).json({ error: err.message }); res.json(rows); }); });
app.get('/api/maintenance/:id', requireLogin, (req, res) => { const { id } = req.params; if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid maintenance ID' }); db.get('SELECT * FROM maintenance WHERE id = ?', [id], (err, row) => { if (err) return res.status(500).json({ error: err.message }); if (!row) return res.status(404).json({ error: 'Record not found' }); res.json(row); }); });
app.post('/api/maintenance', requireLogin, (req, res) => { const { date, equipment, tagnumber, department, equipment_model, user } = req.body; if (!date || typeof date !== 'string' || date.length < 4 || date.length > 50) return res.status(400).json({ error: 'Invalid date' }); if (!equipment || typeof equipment !== 'string' || equipment.length < 1 || equipment.length > 200) return res.status(400).json({ error: 'Invalid equipment' }); if (!tagnumber || typeof tagnumber !== 'string' || tagnumber.length < 1 || tagnumber.length > 50) return res.status(400).json({ error: 'Invalid tagnumber' }); if (!department || typeof department !== 'string' || department.length < 1 || department.length > 50) return res.status(400).json({ error: 'Invalid department' }); if (!equipment_model || typeof equipment_model !== 'string' || equipment_model.length < 1 || equipment_model.length > 100) return res.status(400).json({ error: 'Invalid equipment_model' }); if (!user || typeof user !== 'string' || user.length < 1 || user.length > 100) return res.status(400).json({ error: 'Invalid user' }); db.run('INSERT INTO maintenance (date, equipment, tagnumber, department, equipment_model, user) VALUES (?, ?, ?, ?, ?, ?)', [date, equipment, tagnumber, department, equipment_model, user], function(err) { if (err) return res.status(400).json({ error: err.message }); res.json({ id: this.lastID }); }); });

app.put('/api/maintenance/:id', requireLogin, (req, res) => { const { id } = req.params; const { date, equipment, tagnumber, department, equipment_model, user } = req.body; if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid maintenance ID' }); if (!date || typeof date !== 'string' || date.length < 4 || date.length > 50) return res.status(400).json({ error: 'Invalid date' }); if (!equipment || typeof equipment !== 'string' || equipment.length < 1 || equipment.length > 200) return res.status(400).json({ error: 'Invalid equipment' }); if (!tagnumber || typeof tagnumber !== 'string' || tagnumber.length < 1 || tagnumber.length > 50) return res.status(400).json({ error: 'Invalid tagnumber' }); if (!department || typeof department !== 'string' || department.length < 1 || department.length > 50) return res.status(400).json({ error: 'Invalid department' }); if (!equipment_model || typeof equipment_model !== 'string' || equipment_model.length < 1 || equipment_model.length > 100) return res.status(400).json({ error: 'Invalid equipment_model' }); if (!user || typeof user !== 'string' || user.length < 1 || user.length > 100) return res.status(400).json({ error: 'Invalid user' }); db.run('UPDATE maintenance SET date = ?, equipment = ?, tagnumber = ?, department = ?, equipment_model = ?, user = ? WHERE id = ?', [date, equipment, tagnumber, department, equipment_model, user, id], function(err) { if (err) return res.status(400).json({ error: err.message }); res.json({ updated: this.changes }); }); });
app.delete('/api/maintenance/:id', requireLogin, (req, res) => { const { id } = req.params; if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid maintenance ID' }); db.run('DELETE FROM maintenance WHERE id = ?', [id], function(err) { if (err) return res.status(400).json({ error: err.message }); res.json({ deleted: this.changes }); }); });

// Reports endpoint
app.get('/api/reports/inventory', requireLogin, (req, res) => { const dept = req.query.department; let sql = 'SELECT * FROM inventory'; const params = []; if (dept && dept !== 'all') { sql += ' WHERE department = ?'; params.push(dept); } db.all(sql, params, (err, rows) => { if (err) return res.status(500).json({ error: err.message }); res.json(rows); }); });

// Departments endpoints
app.get('/api/departments', requireLogin, (req, res) => {
  db.all('SELECT id, name FROM departments ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin-only: create department
app.post('/api/departments', requireLogin, (req, res) => {
  const user = req.session?.user;
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) return res.status(400).json({ error: 'Invalid department name' });
  db.run('INSERT INTO departments (name) VALUES (?)', [name.trim().toUpperCase()], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, name: name.trim().toUpperCase() });
  });
});

// Transfers endpoints
// Helper: generate next sequential asset number for a department
function getNextAssetNumber(department, cb) {
  const deptKey = String(department || '').toUpperCase();
  db.serialize(() => {
    db.get('SELECT counter FROM asset_counters WHERE department = ?', [deptKey], (err, row) => {
      if (err) return cb(err);
      if (!row) {
        // insert initial counter = 1
        const next = 1;
        db.run('INSERT INTO asset_counters (department, counter) VALUES (?, ?)', [deptKey, next], function(insErr) {
          if (insErr) return cb(insErr);
          const code = deptKey.replace(/[^A-Z0-9]/g, '').slice(0,10) || 'AS';
          const assetNo = `${code}-${String(next).padStart(5,'0')}`;
          cb(null, assetNo);
        });
      } else {
        const next = Number(row.counter) + 1;
        db.run('UPDATE asset_counters SET counter = ? WHERE department = ?', [next, deptKey], function(updErr) {
          if (updErr) return cb(updErr);
          const code = deptKey.replace(/[^A-Z0-9]/g, '').slice(0,10) || 'AS';
          const assetNo = `${code}-${String(next).padStart(5,'0')}`;
          cb(null, assetNo);
        });
      }
    });
  });
}

app.post('/api/inventory', requireLogin, (req, res) => {
  let { asset_no, asset_type, serial_no, manufacturer, model, version, os_info, status, department } = req.body;
  // normalize department
  department = department ? String(department).toUpperCase() : '';
  if (!department || !isValidString(department,1,100)) return res.status(400).json({ error: 'Invalid department' });
  // verify department exists
  db.get('SELECT id FROM departments WHERE name = ?', [department], (dErr, dRow) => {
    if (dErr) return res.status(500).json({ error: dErr.message });
    if (!dRow) return res.status(400).json({ error: 'Department does not exist' });
    // if no asset_no provided, generate sequential one
    const proceedWithAssetNo = (err, generated) => {
      if (err) return res.status(500).json({ error: err.message });
      asset_no = asset_no && String(asset_no).trim() ? String(asset_no).trim() : generated;
      // continue validations
      if (!asset_no || !isValidString(String(asset_no),1,50)) return res.status(400).json({ error: 'Invalid asset_no' });
      if (!asset_type || !isValidString(asset_type,1,50)) return res.status(400).json({ error: 'Invalid asset_type' });
      if (serial_no && typeof serial_no !== 'string') return res.status(400).json({ error: 'Invalid serial_no' });
      if (manufacturer && typeof manufacturer !== 'string') return res.status(400).json({ error: 'Invalid manufacturer' });
      if (model && typeof model !== 'string') return res.status(400).json({ error: 'Invalid model' });
      if (version && typeof version !== 'string') return res.status(400).json({ error: 'Invalid version' });
      if (os_info && typeof os_info !== 'string') return res.status(400).json({ error: 'Invalid os_info' });
      if (!status || !isValidString(status,1,20)) return res.status(400).json({ error: 'Invalid status' });
      db.run('INSERT INTO inventory (asset_no, asset_type, serial_no, manufacturer, model, version, os_info, status, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [asset_no, asset_type, serial_no, manufacturer, model, version, os_info || '', status, department], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        const insertedId = this.lastID;
        db.get('SELECT * FROM inventory WHERE id = ?', [insertedId], (e2, row) => {
          if (e2) return res.status(500).json({ error: e2.message });
          res.json(row);
        });
      });
    };

    if (!asset_no || (typeof asset_no === 'string' && asset_no.trim() === '')) {
      // generate sequential asset number for this department
      getNextAssetNumber(department, proceedWithAssetNo);
    } else {
      proceedWithAssetNo(null, asset_no);
    }
  });
});

// Records receives items from ICT
app.post('/api/transfers/:id/receive-records', requireLogin, (req, res) => {
  const { id } = req.params;
  const { records_notes } = req.body;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid transfer id' });
  const username = req.session?.user?.username || 'Unknown';
  const received_at = new Date().toISOString();
  db.run('UPDATE transfers SET status = ?, records_received_by = ?, records_received_at = ?, records_notes = ? WHERE id = ?', ['ReceivedByRecords', username, received_at, records_notes || '', id], function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ updated: this.changes }); });
});

// Records ships to destination
app.post('/api/transfers/:id/ship', requireLogin, (req, res) => {
  const { id } = req.params;
  const { tracking_info, destination } = req.body;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid transfer id' });
  const username = req.session?.user?.username || 'Unknown';
  const shipped_at = new Date().toISOString();
  const sql = destination ? 'UPDATE transfers SET status = ?, shipped_by = ?, shipped_at = ?, tracking_info = ?, destination = ? WHERE id = ?' : 'UPDATE transfers SET status = ?, shipped_by = ?, shipped_at = ?, tracking_info = ? WHERE id = ?';
  const params = destination ? ['Shipped', username, shipped_at, tracking_info || '', destination, id] : ['Shipped', username, shipped_at, tracking_info || '', id];
  db.run(sql, params, function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ updated: this.changes }); });
});

// Destination acknowledges final delivery
app.post('/api/transfers/:id/acknowledge', requireLogin, (req, res) => {
  const { id } = req.params;
  const { received_by } = req.body;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid transfer id' });
  if (!received_by || !isValidString(received_by,1,100)) return res.status(400).json({ error: 'Invalid received_by' });
  const received_at = new Date().toISOString();
  db.run('UPDATE transfers SET status = ?, destination_received_by = ?, destination_received_at = ? WHERE id = ?', ['Delivered', received_by, received_at, id], function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ updated: this.changes }); });
});

app.get('/api/transfers/:id', requireLogin, (req, res) => { const { id } = req.params; if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid transfer id' }); const sql = `SELECT t.*, i.asset_no, i.asset_type, i.serial_no as item_serial_no, i.manufacturer as item_manufacturer, i.model as item_model, i.version as item_version, i.department as item_department FROM transfers t LEFT JOIN inventory i ON t.inventory_id = i.id WHERE t.id = ?`; db.get(sql, [id], (err, row) => { if (err) return res.status(500).json({ error: err.message }); if (!row) return res.status(404).json({ error: 'Transfer not found' }); res.json(row); }); });
