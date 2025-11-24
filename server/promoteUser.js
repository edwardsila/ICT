#!/usr/bin/env node
const path = require('path');
const Database = require('better-sqlite3');

// Usage: node promoteUser.js <username>
const username = process.argv[2];
if (!username) {
  console.error('Usage: node promoteUser.js <username>');
  process.exit(1);
}

const dbPath = path.join(__dirname, 'ict_inventory.db');
let db;
try {
  db = new Database(dbPath);
} catch (err) {
  console.error('Failed to open database at', dbPath, '\n', err && err.message ? err.message : err);
  process.exit(2);
}

try {
  const user = db.prepare('SELECT id, username, role FROM users WHERE username = ?').get(username);
  if (!user) {
    console.error(`User not found: ${username}`);
    process.exit(3);
  }
  if (user.role === 'admin') {
    console.log(`User '${username}' is already an admin.`);
    process.exit(0);
  }
  const info = db.prepare('UPDATE users SET role = ? WHERE username = ?').run('admin', username);
  if (info.changes === 1) {
    console.log(`User '${username}' promoted to admin.`);
    process.exit(0);
  } else {
    console.error('No rows updated.');
    process.exit(4);
  }
} catch (err) {
  console.error('Failed to promote user:', err && err.message ? err.message : err);
  process.exit(5);
}
