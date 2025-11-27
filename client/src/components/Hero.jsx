import React from 'react';

// Simple Hero component (App.js implements the main hero already).
export default function Hero() {
  return null;
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

// Lookup inventory by tag (asset_no or serial_no)
app.get('/api/inventory/by-tag', requireLogin, (req, res) => {
  const tag = req.query.tag;
  if (!tag || typeof tag !== 'string' || tag.trim().length === 0) return res.status(400).json({ error: 'Tag required' });
  const t = tag.trim();
  // Normalize and perform a sequence of attempts:
  // 1) exact match on asset_no/serial_no after removing hyphens and uppercasing
  // 2) exact match on UPPER(asset_no)/UPPER(serial_no)
  // 3) prefix match on UPPER(asset_no)/UPPER(serial_no)
  // 4) contains match on REPLACE(UPPER(asset_no),'-','') and serial_no
  const normalized = t.toUpperCase();
  const noHyphen = normalized.replace(/[-\s]/g, '');

  const tryExactNoHyphen = () => {
    const sql = `SELECT * FROM inventory WHERE REPLACE(UPPER(asset_no), '-', '') = ? OR REPLACE(UPPER(serial_no), '-', '') = ? LIMIT 1`;
    return new Promise((resolve, reject) => db.get(sql, [noHyphen, noHyphen], (err, row) => err ? reject(err) : resolve(row)));
  };
  const tryExactUpper = () => {
    const sql = `SELECT * FROM inventory WHERE UPPER(asset_no) = ? OR UPPER(serial_no) = ? LIMIT 1`;
    return new Promise((resolve, reject) => db.get(sql, [normalized, normalized], (err, row) => err ? reject(err) : resolve(row)));
  };
  const tryPrefix = () => {
    const sql = `SELECT * FROM inventory WHERE UPPER(asset_no) LIKE ? OR UPPER(serial_no) LIKE ? LIMIT 1`;
    return new Promise((resolve, reject) => db.get(sql, [normalized + '%', normalized + '%'], (err, row) => err ? reject(err) : resolve(row)));
  };
  const tryContainsNoHyphen = () => {
    const likeVal = '%' + noHyphen + '%';
    const sql = `SELECT * FROM inventory WHERE REPLACE(UPPER(asset_no), '-', '') LIKE ? OR REPLACE(UPPER(serial_no), '-', '') LIKE ? LIMIT 1`;
    return new Promise((resolve, reject) => db.get(sql, [likeVal, likeVal], (err, row) => err ? reject(err) : resolve(row)));
  };

  (async () => {
    try {
      let row = await tryExactNoHyphen();
      if (!row) row = await tryExactUpper();
      if (!row) row = await tryPrefix();
      if (!row) row = await tryContainsNoHyphen();
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  })();
});

// Return latest N inventory items (by received_at desc)
app.get('/api/inventory/recent', requireLogin, (req, res) => {
  let limit = parseInt(req.query.limit, 10) || 10;
  if (isNaN(limit) || limit <= 0) limit = 10;
  if (limit > 100) limit = 100;
  const sql = `SELECT * FROM inventory ORDER BY received_at DESC LIMIT ?`;
  db.all(sql, [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
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
app.get('/api/maintenance', requireLogin, (req, res) => {
  const sql = `SELECT m.*, i.asset_no as inventory_asset_no, i.asset_type as inventory_asset_type, i.serial_no as inventory_serial_no, i.manufacturer as inventory_manufacturer, i.model as inventory_model, i.version as inventory_version, i.os_info as inventory_os, i.department as inventory_department FROM maintenance m LEFT JOIN inventory i ON m.inventory_id = i.id`;
  db.all(sql, [], (err, rows) => { if (err) return res.status(500).json({ error: err.message }); res.json(rows); });
});

app.get('/api/maintenance/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid maintenance ID' });
  const sql = `SELECT m.*, i.asset_no as inventory_asset_no, i.asset_type as inventory_asset_type, i.serial_no as inventory_serial_no, i.manufacturer as inventory_manufacturer, i.model as inventory_model, i.version as inventory_version, i.os_info as inventory_os, i.department as inventory_department FROM maintenance m LEFT JOIN inventory i ON m.inventory_id = i.id WHERE m.id = ?`;
  db.get(sql, [id], (err, row) => { if (err) return res.status(500).json({ error: err.message }); if (!row) return res.status(404).json({ error: 'Record not found' }); res.json(row); });
});
app.post('/api/maintenance', requireLogin, (req, res) => {
  const { date, equipment, tagnumber, department, equipment_model, user, inventory_id, repair_notes } = req.body;
  if (!date || typeof date !== 'string' || date.length < 4 || date.length > 50) return res.status(400).json({ error: 'Invalid date' });
  if (!equipment || typeof equipment !== 'string' || equipment.length < 1 || equipment.length > 200) return res.status(400).json({ error: 'Invalid equipment' });
  if (!tagnumber || typeof tagnumber !== 'string' || tagnumber.length < 1 || tagnumber.length > 50) return res.status(400).json({ error: 'Invalid tagnumber' });
  if (!department || typeof department !== 'string' || department.length < 1 || department.length > 50) return res.status(400).json({ error: 'Invalid department' });
  if (!equipment_model || typeof equipment_model !== 'string' || equipment_model.length < 1 || equipment_model.length > 100) return res.status(400).json({ error: 'Invalid equipment_model' });
  if (!user || typeof user !== 'string' || user.length < 1 || user.length > 100) return res.status(400).json({ error: 'Invalid user' });

  // if inventory_id provided, validate it exists
  const insertMaintenance = () => {
    db.run('INSERT INTO maintenance (date, equipment, tagnumber, department, equipment_model, user, inventory_id, repair_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [date, equipment, tagnumber, department, equipment_model, user, inventory_id || null, repair_notes || ''], function(err) { if (err) return res.status(400).json({ error: err.message }); res.json({ id: this.lastID }); });
  };

  if (inventory_id) {
    db.get('SELECT id FROM inventory WHERE id = ?', [inventory_id], (iErr, iRow) => {
      if (iErr) return res.status(500).json({ error: iErr.message });
      if (!iRow) return res.status(400).json({ error: 'Referenced inventory item does not exist' });
      insertMaintenance();
    });
  } else {
    insertMaintenance();
  }
});

// Mark maintenance record as sent to ICT (for repair)
app.post('/api/maintenance/:id/send-to-ict', requireLogin, (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid maintenance ID' });
  const sent_at = new Date().toISOString();
  db.run("UPDATE maintenance SET sent_to_ict = 1, sent_to_ict_at = ?, repair_notes = COALESCE(repair_notes, '') || ? WHERE id = ?", [sent_at, '\n' + (notes || ''), id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Mark maintenance record as returned from ICT
app.post('/api/maintenance/:id/mark-returned', requireLogin, (req, res) => {
  const { id } = req.params;
  const { notes, repair_status } = req.body;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid maintenance ID' });
  const returned_at = new Date().toISOString();
  db.run("UPDATE maintenance SET returned = 1, returned_at = ?, repair_notes = COALESCE(repair_notes, '') || ?, repair_status = ? WHERE id = ?", [returned_at, '\n' + (notes || ''), repair_status || 'Returned', id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Create maintenance records for a whole department (optionally per-device)
app.post('/api/maintenance/department', requireLogin, (req, res) => {
  // Accept start_date (preferred) or date (backwards compatibility)
  const { department, date, start_date, equipment, equipment_model, user, repair_notes, inventory_ids, create_for_all } = req.body;
  // Prefer explicit start_date, fall back to date, otherwise default to now (so UI can omit it)
  let recordStart = null;
  if (start_date && typeof start_date === 'string' && start_date.trim().length > 0) recordStart = start_date;
  else if (date && typeof date === 'string' && date.trim().length > 0) recordStart = date;
  else recordStart = new Date().toISOString();
  if (!department || typeof department !== 'string' || department.length < 1 || department.length > 100) return res.status(400).json({ error: 'Invalid department' });
  // recordStart is always set (defaults to now) but validate type/length
  if (!recordStart || typeof recordStart !== 'string' || recordStart.length < 4 || recordStart.length > 200) return res.status(400).json({ error: 'Invalid start_date' });
  // user is optional for department-level maintenance; use provided user or session username when available
  const effectiveUser = (typeof user === 'string' && user.length > 0) ? user : (req.session?.user?.username || null);

  const dept = department;

  // If create_for_all is true, fetch all inventory items for the department and create per-item maintenance records
  const createForInventoryList = (items) => {
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No inventory items found for department' });
    const createdIds = [];
    db.serialize(() => {
      // include start_date, end_date, progress, dept_status and machines_not_maintained for department-level records
      const stmt = db.prepare('INSERT INTO maintenance (date, start_date, end_date, equipment, tagnumber, department, equipment_model, user, inventory_id, repair_notes, progress, dept_status, machines_not_maintained) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      items.forEach(it => {
        const tagnumber = String(it.asset_no || `DEPT-${dept}-${Date.now()}`).slice(0,50);
        stmt.run(recordStart, req.body.start_date || null, req.body.end_date || null, equipment || it.asset_type || 'Device', tagnumber, dept, equipment_model || it.model || '', effectiveUser, it.id, repair_notes || '', req.body.progress || 0, req.body.status || 'pending', Number.isFinite(Number(req.body.machines_not_maintained)) ? Number(req.body.machines_not_maintained) : 0);
        // Can't get lastID easily here synchronously — collect using lastID in final callback is complex; we will return a count instead
      });
      stmt.finalize(err => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ created: items.length });
      });
    });
  };

  if (create_for_all) {
    db.all('SELECT id, asset_no, asset_type, model FROM inventory WHERE department = ?', [dept], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      createForInventoryList(rows || []);
    });
    return;
  }

  // If inventory_ids provided, create entries for those
  if (Array.isArray(inventory_ids) && inventory_ids.length > 0) {
    // validate each id exists
    const placeholders = inventory_ids.map(() => '?').join(',');
    db.all(`SELECT id, asset_no, asset_type, model FROM inventory WHERE id IN (${placeholders})`, inventory_ids, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows || rows.length === 0) return res.status(400).json({ error: 'No matching inventory items found' });
      createForInventoryList(rows);
    });
    return;
  }

  // Otherwise create a single department-level maintenance record (inventory_id NULL)
  const tagnumber = `DEPT-MAINT-${dept}-${Date.now()}`.slice(0,50);
  // Insert a single department-level maintenance record (inventory_id NULL) including start/end/progress/status and machines_not_maintained
  db.run('INSERT INTO maintenance (date, start_date, end_date, equipment, tagnumber, department, equipment_model, user, inventory_id, repair_notes, progress, dept_status, machines_not_maintained) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [recordStart, req.body.start_date || null, req.body.end_date || null, equipment || 'Department Sweep', tagnumber, dept, equipment_model || '', effectiveUser, null, repair_notes || '', req.body.progress || 0, req.body.status || 'pending', Number.isFinite(Number(req.body.machines_not_maintained)) ? Number(req.body.machines_not_maintained) : 0], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put('/api/maintenance/:id', requireLogin, (req, res) => {
  const { id } = req.params;
  const { date, equipment, tagnumber, department, equipment_model, user, inventory_id, sent_to_ict, returned, repair_notes, repair_status } = req.body;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid maintenance ID' });
  if (!date || typeof date !== 'string' || date.length < 4 || date.length > 50) return res.status(400).json({ error: 'Invalid date' });
  if (!equipment || typeof equipment !== 'string' || equipment.length < 1 || equipment.length > 200) return res.status(400).json({ error: 'Invalid equipment' });
  if (!tagnumber || typeof tagnumber !== 'string' || tagnumber.length < 1 || tagnumber.length > 50) return res.status(400).json({ error: 'Invalid tagnumber' });
  if (!department || typeof department !== 'string' || department.length < 1 || department.length > 50) return res.status(400).json({ error: 'Invalid department' });
  if (!equipment_model || typeof equipment_model !== 'string' || equipment_model.length < 1 || equipment_model.length > 100) return res.status(400).json({ error: 'Invalid equipment_model' });
  if (!user || typeof user !== 'string' || user.length < 1 || user.length > 100) return res.status(400).json({ error: 'Invalid user' });

  const doUpdate = () => {
    db.run('UPDATE maintenance SET date = ?, equipment = ?, tagnumber = ?, department = ?, equipment_model = ?, user = ?, inventory_id = ?, sent_to_ict = ?, returned = ?, repair_notes = ?, repair_status = ? WHERE id = ?', [date, equipment, tagnumber, department, equipment_model, user, inventory_id || null, sent_to_ict ? 1 : 0, returned ? 1 : 0, repair_notes || '', repair_status || '', id], function(err) { if (err) return res.status(400).json({ error: err.message }); res.json({ updated: this.changes }); });
  };

  if (inventory_id) {
    db.get('SELECT id FROM inventory WHERE id = ?', [inventory_id], (iErr, iRow) => {
      if (iErr) return res.status(500).json({ error: iErr.message });
      if (!iRow) return res.status(400).json({ error: 'Referenced inventory item does not exist' });
      doUpdate();
    });
  } else {
    doUpdate();
  }
});
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
  let { asset_no, asset_type, serial_no, manufacturer, model, version, os_info, status, department, replacement_of } = req.body;
  // initial normalize
  department = department ? String(department).toUpperCase() : '';

  const handleInsert = (deptToUse) => {
    // ensure department exists (create if missing), then verify
    db.run('INSERT OR IGNORE INTO departments (name) VALUES (?)', [deptToUse], (insErr) => {
      if (insErr) return res.status(500).json({ error: insErr.message });

      db.get('SELECT id FROM departments WHERE name = ?', [deptToUse], (dErr, dRow) => {
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
          const received_at = new Date().toISOString();

          db.run('INSERT INTO inventory (asset_no, asset_type, serial_no, manufacturer, model, version, os_info, status, department, received_at, replacement_of) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [asset_no, asset_type, serial_no, manufacturer, model, version, os_info || '', status, deptToUse, received_at, replacement_of || null], function(err) {
            if (err) return res.status(400).json({ error: err.message });
            const insertedId = this.lastID;
            // if this item is a replacement of another, set replaced_by on the old item and mark old status
            if (replacement_of) {
              db.run('UPDATE inventory SET replaced_by = ?, status = ? WHERE id = ?', [insertedId, 'Replaced', replacement_of], (uErr) => { if (uErr) console.error('Failed to mark replaced_by/status:', uErr.message); });
            }
            db.get('SELECT * FROM inventory WHERE id = ?', [insertedId], (e2, row) => {
              if (e2) return res.status(500).json({ error: e2.message });
              res.json(row);
            });
          });
        };

        if (!asset_no || (typeof asset_no === 'string' && asset_no.trim() === '')) {
          // generate sequential asset number for this department
          getNextAssetNumber(deptToUse, proceedWithAssetNo);
        } else {
          proceedWithAssetNo(null, asset_no);
        }
      });
    });
  };

  if (replacement_of) {
    // ensure replacement_of exists and possibly inherit its department if new item has no department
    db.get('SELECT * FROM inventory WHERE id = ?', [replacement_of], (rErr, old) => {
      if (rErr) return res.status(500).json({ error: rErr.message });
      if (!old) return res.status(400).json({ error: 'Item to replace not found' });
      const deptToUse = (!department || department === '') ? (old.department || 'UNASSIGNED') : String(department).toUpperCase();
      handleInsert(deptToUse);
    });
  } else {
    const deptToUse = department && department !== '' ? String(department).toUpperCase() : 'UNASSIGNED';
    handleInsert(deptToUse);
  }
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

// Create a transfer record (incoming from branch or internal transfer)
app.post('/api/transfers', requireLogin, (req, res) => {
  // Accept branch-specific fields: repaired_status, repaired_by, repair_comments, date_received, date_sent
  const { inventory_id, from_department, to_department, destination, notes, transfer_type, repaired_status, repaired_by, repair_comments, date_received, date_sent, received_by, issue_comments, replacement_inventory_id } = req.body;
  if (!inventory_id || isNaN(Number(inventory_id))) return res.status(400).json({ error: 'Invalid inventory_id' });
  if (!from_department || typeof from_department !== 'string' || from_department.length < 1) return res.status(400).json({ error: 'Invalid from_department' });
  if (!to_department || typeof to_department !== 'string' || to_department.length < 1) return res.status(400).json({ error: 'Invalid to_department' });
  // optional validations for repair fields
  const repairedStatusVal = (typeof repaired_status === 'string' && repaired_status.length > 0) ? repaired_status : null;
  const repairedByVal = (typeof repaired_by === 'string' && repaired_by.length > 0) ? repaired_by : null;
  const repairCommentsVal = (typeof repair_comments === 'string' && repair_comments.length > 0) ? repair_comments : null;
  const dateReceivedVal = (typeof date_received === 'string' && date_received.length > 0) ? date_received : null;
  const dateSentVal = (typeof date_sent === 'string' && date_sent.length > 0) ? date_sent : null;

  // verify inventory exists
  db.get('SELECT * FROM inventory WHERE id = ?', [inventory_id], (iErr, item) => {
    if (iErr) return res.status(500).json({ error: iErr.message });
    if (!item) return res.status(400).json({ error: 'Inventory item not found' });
    const sent_by = req.session?.user?.username || 'Unknown';
    const sent_at = new Date().toISOString();
  const sql = 'INSERT INTO transfers (inventory_id, from_department, to_department, destination, transfer_type, sent_by, sent_at, status, notes, date_received, date_sent, repaired_status, repaired_by, repair_comments, received_by, issue_comments, replacement_inventory_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const params = [inventory_id, String(from_department).toUpperCase(), String(to_department).toUpperCase(), destination || null, transfer_type || null, sent_by, sent_at, 'Sent', notes || '', dateReceivedVal, dateSentVal, repairedStatusVal, repairedByVal, repairCommentsVal, (typeof received_by === 'string' ? received_by : null), (typeof issue_comments === 'string' ? issue_comments : null), (replacement_inventory_id ? replacement_inventory_id : null)];
    db.run(sql, params, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const transferId = this.lastID;
      // If this is an internal replacement and replacement info was provided, perform replacement immediately
      if (String(transfer_type) === 'internal' && (replacement_inventory_id || req.body.replacement_details)) {
        // reuse logic similar to complete-replacement
        const repId = replacement_inventory_id || null;
        const repDetails = req.body.replacement_details || null;
        // fetch transfer row to get inventory_id and from_department
        db.get('SELECT * FROM transfers WHERE id = ?', [transferId], (tErr, tRow) => {
          if (tErr) { console.error('Failed to fetch transfer after insert', tErr); return res.json({ id: transferId }); }
          const faultyId = tRow.inventory_id;
          const originalDept = tRow.from_department || 'UNASSIGNED';
          const actor = req.session?.user?.username || 'Unknown';
          const now = new Date().toISOString();

          const finalizeReplacement = (newInventoryId) => {
            db.run('UPDATE inventory SET status = ?, department = ? WHERE id = ?', ['In ICT', 'UNASSIGNED', faultyId], (uErr) => { if (uErr) console.error('Failed to mark faulty inventory:', uErr.message); });
            db.run('UPDATE inventory SET replacement_of = ? WHERE id = ?', [faultyId, newInventoryId], (uErr2) => { if (uErr2) console.error('Failed to set replacement_of on new item:', uErr2.message); });
            db.run('UPDATE inventory SET replaced_by = ? WHERE id = ?', [newInventoryId, faultyId], (uErr3) => { if (uErr3) console.error('Failed to set replaced_by on faulty item:', uErr3.message); });
            db.run('UPDATE transfers SET status = ?, destination_received_by = ?, destination_received_at = ?, records_notes = COALESCE(records_notes, "") || ? WHERE id = ?', ['Replaced', actor, now, '\nReplacement processed by ' + actor, transferId], function(err2) { if (err2) console.error('Failed to update transfer after replacement', err2.message); });
          };

          if (repId) {
            db.get('SELECT * FROM inventory WHERE id = ?', [repId], (rErr, rep) => {
              if (rErr) { console.error(rErr); return res.json({ id: transferId }); }
              if (!rep) return res.json({ id: transferId, warning: 'Replacement inventory not found' });
              db.run('UPDATE inventory SET department = ?, status = ? WHERE id = ?', [originalDept, 'Active', repId], (upErr) => { if (upErr) console.error('Failed to assign replacement inventory department:', upErr.message); finalizeReplacement(repId); });
            });
          } else if (repDetails && typeof repDetails === 'object') {
            getNextAssetNumber(originalDept, (gErr, generated) => {
              if (gErr) { console.error(gErr); return res.json({ id: transferId }); }
              const asset_no = generated;
              const asset_type = repDetails.asset_type || 'Laptop';
              const serial_no = repDetails.serial_no || null;
              const manufacturer = repDetails.manufacturer || null;
              const model = repDetails.model || null;
              const version = repDetails.version || null;
              const os_info = repDetails.os_info || null;
              const status = repDetails.status || 'Active';
              const received_at = new Date().toISOString();
              db.run('INSERT INTO inventory (asset_no, asset_type, serial_no, manufacturer, model, version, os_info, status, department, received_at, replacement_of) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [asset_no, asset_type, serial_no, manufacturer, model, version, os_info || '', status, originalDept, received_at, faultyId], function(insErr) {
                if (insErr) { console.error(insErr); return res.json({ id: transferId }); }
                const newId = this.lastID;
                db.run('UPDATE inventory SET replaced_by = ? WHERE id = ?', [newId, faultyId], (uErr) => { if (uErr) console.error('Failed to set replaced_by on faulty item:', uErr.message); });
                finalizeReplacement(newId);
              });
            });
          }
        });
      }
      return res.json({ id: transferId });
    });
  });
});

// List transfers (optional filter by status)
app.get('/api/transfers', requireLogin, (req, res) => {
  const status = req.query.status;
  let sql = `SELECT t.*, i.asset_no, i.asset_type, i.serial_no as item_serial_no, i.department as item_department FROM transfers t LEFT JOIN inventory i ON t.inventory_id = i.id`;
  const params = [];
  if (status) { sql += ' WHERE t.status = ?'; params.push(status); }
  sql += ' ORDER BY t.sent_at DESC LIMIT 200';
  db.all(sql, params, (err, rows) => { if (err) return res.status(500).json({ error: err.message }); res.json(rows || []); });
});

// Mark transfer as received by ICT (move item into ICT/UNASSIGNED pool)
app.post('/api/transfers/:id/receive-ict', requireLogin, (req, res) => {
  const { id } = req.params;
  const { records_notes } = req.body;
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid transfer id' });
  const username = req.session?.user?.username || 'Unknown';
  const received_at = new Date().toISOString();
  // update transfer status
  db.get('SELECT * FROM transfers WHERE id = ?', [id], (tErr, tRow) => {
    if (tErr) return res.status(500).json({ error: tErr.message });
    if (!tRow) return res.status(404).json({ error: 'Transfer not found' });
    // set inventory department to UNASSIGNED and mark received_at on inventory
    db.run('UPDATE inventory SET department = ?, received_at = ? WHERE id = ?', ['UNASSIGNED', received_at, tRow.inventory_id], (uErr) => {
      if (uErr) console.error('Failed to update inventory on receive-ict:', uErr.message);
      db.run('UPDATE transfers SET status = ?, records_received_by = ?, records_received_at = ?, records_notes = ? WHERE id = ?', ['ReceivedByICT', username, received_at, records_notes || '', id], function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ updated: this.changes }); });
    });
  });
});

// Complete an internal replacement: assign a replacement inventory (existing or new) to replace the faulty item
app.post('/api/transfers/:id/complete-replacement', requireLogin, (req, res) => {
  const { id } = req.params;
  const { replacement_inventory_id, replacement_details } = req.body; // replacement_details: { asset_type, serial_no, manufacturer, model, version, os_info, status }
  if (!id || isNaN(Number(id))) return res.status(400).json({ error: 'Invalid transfer id' });
  db.get('SELECT t.*, i.* FROM transfers t LEFT JOIN inventory i ON t.inventory_id = i.id WHERE t.id = ?', [id], (tErr, row) => {
    if (tErr) return res.status(500).json({ error: tErr.message });
    if (!row) return res.status(404).json({ error: 'Transfer not found' });
    const faultyId = row.inventory_id;
    const originalDept = row.from_department || (row.department || 'UNASSIGNED');
    const actor = req.session?.user?.username || 'Unknown';
    const now = new Date().toISOString();

    const finalizeReplacement = (newInventoryId) => {
      // mark the faulty item as In ICT (or Replaced) and set replaced_by on faulty
      db.run('UPDATE inventory SET status = ?, department = ? WHERE id = ?', ['In ICT', 'UNASSIGNED', faultyId], (uErr) => { if (uErr) console.error('Failed to mark faulty inventory:', uErr.message); });
      db.run('UPDATE inventory SET replacement_of = ? WHERE id = ?', [faultyId, newInventoryId], (uErr2) => { if (uErr2) console.error('Failed to set replacement_of on new item:', uErr2.message); });
      db.run('UPDATE inventory SET replaced_by = ? WHERE id = ?', [newInventoryId, faultyId], (uErr3) => { if (uErr3) console.error('Failed to set replaced_by on faulty item:', uErr3.message); });
      // update transfer record
      db.run('UPDATE transfers SET status = ?, destination_received_by = ?, destination_received_at = ?, records_notes = COALESCE(records_notes, "") || ? WHERE id = ?', ['Replaced', actor, now, '\nReplacement processed by ' + actor, id], function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ transfer_updated: this.changes, replacement_id: newInventoryId }); });
    };

    if (replacement_inventory_id) {
      // Use an existing inventory item as replacement
      db.get('SELECT * FROM inventory WHERE id = ?', [replacement_inventory_id], (rErr, rep) => {
        if (rErr) return res.status(500).json({ error: rErr.message });
        if (!rep) return res.status(400).json({ error: 'Replacement inventory not found' });
        // assign replacement to original department/user
        db.run('UPDATE inventory SET department = ?, status = ? WHERE id = ?', [originalDept, 'Active', replacement_inventory_id], (upErr) => { if (upErr) return res.status(500).json({ error: upErr.message }); finalizeReplacement(replacement_inventory_id); });
      });
    } else if (replacement_details && typeof replacement_details === 'object') {
      // create a new inventory item and link it
      const deptToUse = originalDept || 'UNASSIGNED';
      // generate asset_no for dept
      getNextAssetNumber(deptToUse, (gErr, generated) => {
        if (gErr) return res.status(500).json({ error: gErr.message });
        const asset_no = generated;
        const asset_type = replacement_details.asset_type || 'Laptop';
        const serial_no = replacement_details.serial_no || null;
        const manufacturer = replacement_details.manufacturer || null;
        const model = replacement_details.model || null;
        const version = replacement_details.version || null;
        const os_info = replacement_details.os_info || null;
        const status = replacement_details.status || 'Active';
        const received_at = new Date().toISOString();
        db.run('INSERT INTO inventory (asset_no, asset_type, serial_no, manufacturer, model, version, os_info, status, department, received_at, replacement_of) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [asset_no, asset_type, serial_no, manufacturer, model, version, os_info || '', status, deptToUse, received_at, faultyId], function(insErr) {
          if (insErr) return res.status(500).json({ error: insErr.message });
          const newId = this.lastID;
          // mark faulty as replaced_by
          db.run('UPDATE inventory SET replaced_by = ? WHERE id = ?', [newId, faultyId], (uErr) => { if (uErr) console.error('Failed to set replaced_by on faulty item:', uErr.message); });
          finalizeReplacement(newId);
        });
      });
    } else {
      return res.status(400).json({ error: 'Provide either replacement_inventory_id or replacement_details' });
    }
  });
});