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
  
      // Ensure additional columns exist for transfer lifecycle (safe to run on start)
      const ensureTransferColumns = () => {
        const alterStatements = [
          "ALTER TABLE transfers ADD COLUMN destination TEXT",
          "ALTER TABLE transfers ADD COLUMN records_received_by TEXT",
          "ALTER TABLE transfers ADD COLUMN records_received_at TEXT",
          "ALTER TABLE transfers ADD COLUMN records_notes TEXT",
          "ALTER TABLE transfers ADD COLUMN shipped_by TEXT",
          "ALTER TABLE transfers ADD COLUMN shipped_at TEXT",
          "ALTER TABLE transfers ADD COLUMN tracking_info TEXT",
          "ALTER TABLE transfers ADD COLUMN destination_received_by TEXT",
          "ALTER TABLE transfers ADD COLUMN destination_received_at TEXT"
        ];
        alterStatements.forEach(sql => {
          db.run(sql, [], err => {
            if (err) {
              // Ignore duplicate column errors; log others
              if (!/duplicate column|already exists/i.test(err.message)) {
                console.error('Error ensuring transfer columns:', err.message);
              }
            }
          });
        });
      };
  
      ensureTransferColumns();
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_no TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    serial_no TEXT,
    manufacturer TEXT,
    model TEXT,
    version TEXT,
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
};

createTables();

// Transfers table
db.run(`CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_id INTEGER NOT NULL,
  from_department TEXT NOT NULL,
      const { destination } = req.body;
      if (!destination || !isValidString(destination)) return res.status(400).json({ error: 'Invalid destination' });
  to_department TEXT NOT NULL,
  sent_by TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Sent',
  received_by TEXT,
  received_at TEXT,
  notes TEXT,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id)
)`);

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
      db.run('UPDATE transfers SET status = ?, destination_received_by = ?, destination_received_at = ? WHERE id = ?', ['Delivered', received_by, received_at, id], function(err) {
  console.log('Register request body:', req.body);
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
        console.error('Bcrypt hash error:', err);
        return res.status(500).json({ error: 'Registration failed' });
      }
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


// REGISTRATION HANDLER

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Login required' });
  }
  next();
}

// Inventory CRUD
app.get('/api/inventory', requireLogin, (req, res) => {
  const dept = req.query.department;
  let sql = 'SELECT * FROM inventory';
  let params = [];
  if (dept) {
    sql += ' WHERE department = ?';
    params.push(dept);
  }
  db.all(sql, params, (err, rows) => {
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
  const { asset_no, asset_type, serial_no, manufacturer, model, version, status, department } = req.body;
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
  if (!department || typeof department !== 'string' || department.length < 1 || department.length > 50) {
    return res.status(400).json({ error: 'Invalid department' });
  }
  db.run(
    'INSERT INTO inventory (asset_no, asset_type, serial_no, manufacturer, model, version, status, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [asset_no, asset_type, serial_no, manufacturer, model, version, status, department],
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
  db.run(
    'UPDATE inventory SET asset_no = ?, asset_type = ?, serial_no = ?, manufacturer = ?, model = ?, version = ?, status = ? WHERE id = ?',
    [asset_no, asset_type, serial_no, manufacturer, model, version, status, id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/inventory/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid inventory ID' });
  }
  db.run('DELETE FROM inventory WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ deleted: this.changes });
  });
});

// MAINTENANCE ENDPOINTS
app.get('/api/maintenance', requireLogin, async (req, res) => {
  db.all('SELECT * FROM maintenance', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/maintenance/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid maintenance ID' });
  }
  db.get('SELECT * FROM maintenance WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) return res.status(404).json({ error: 'Record not found' });
    res.json(row);
  });
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
  db.run(
    'INSERT INTO maintenance (date, equipment, tagnumber, department, equipment_model, user) VALUES (?, ?, ?, ?, ?, ?)',
    [date, equipment, tagnumber, department, equipment_model, user],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
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
  db.run(
    'UPDATE maintenance SET date = ?, equipment = ?, tagnumber = ?, department = ?, equipment_model = ?, user = ? WHERE id = ?',
    [date, equipment, tagnumber, department, equipment_model, user, id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ updated: this.changes });
    }
  );
});

app.delete('/api/maintenance/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Invalid maintenance ID' });
  }
  db.run('DELETE FROM maintenance WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ deleted: this.changes });
  });
});

// Reports endpoint (protected)

// Inventory report endpoint
app.get('/api/reports/inventory', requireLogin, (req, res) => {
  const dept = req.query.department;
  let sql = 'SELECT * FROM inventory';
  let params = [];
  if (dept && dept !== 'all') {
    sql += ' WHERE department = ?';
    params.push(dept);
  }
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Transfers endpoints
// Create a transfer (log sending an item to another department)
app.post('/api/transfers', requireLogin, (req, res) => {
  const { inventory_id, from_department, to_department, sent_by, notes } = req.body;
  if (!inventory_id || isNaN(Number(inventory_id))) return res.status(400).json({ error: 'Invalid inventory_id' });
  if (!from_department || !isValidString(from_department)) return res.status(400).json({ error: 'Invalid from_department' });
  if (!to_department || !isValidString(to_department)) return res.status(400).json({ error: 'Invalid to_department' });
  if (!sent_by || !isValidString(sent_by)) return res.status(400).json({ error: 'Invalid sent_by' });
  const sent_at = new Date().toISOString();
  // Ensure inventory exists
  db.get('SELECT * FROM inventory WHERE id = ?', [inventory_id], (err, inv) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!inv) return res.status(400).json({ error: 'Inventory item not found' });
    db.run(
      'INSERT INTO transfers (inventory_id, from_department, to_department, sent_by, sent_at, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [inventory_id, from_department, to_department, sent_by, sent_at, 'Sent', notes || ''],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      }
    );
  });
});

// Get all transfers (optionally filter by department or status)
app.get('/api/transfers', requireLogin, (req, res) => {
  const { department, status } = req.query;
  let sql = `SELECT t.*, i.asset_no, i.asset_type, i.serial_no as item_serial_no, i.manufacturer as item_manufacturer, i.model as item_model, i.version as item_version, i.department as item_department FROM transfers t LEFT JOIN inventory i ON t.inventory_id = i.id`;
  const params = [];
  const conditions = [];
  if (department) {
    conditions.push('(from_department = ? OR to_department = ?)');
    params.push(department, department);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY sent_at DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Acknowledge receipt of transfer
app.post('/api/transfers/:id/acknowledge', requireLogin, (req, res) => {
  const { id } = req.params;
  const { received_by } = req.body;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid transfer id' });
  if (!received_by || !isValidString(received_by)) return res.status(400).json({ error: 'Invalid received_by' });
  const received_at = new Date().toISOString();
  db.run('UPDATE transfers SET status = ?, received_by = ?, received_at = ? WHERE id = ?', ['Received', received_by, received_at, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Get specific transfer
app.get('/api/transfers/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid transfer id' });
  const sql = `SELECT t.*, i.asset_no, i.asset_type, i.serial_no as item_serial_no, i.manufacturer as item_manufacturer, i.model as item_model, i.version as item_version, i.department as item_department FROM transfers t LEFT JOIN inventory i ON t.inventory_id = i.id WHERE t.id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Transfer not found' });
    res.json(row);
  });
});

// ...existing code...

