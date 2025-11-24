# ICT Management System - Quick Reference Guide

## What This System Does

The MWALIMU Towers ICT Management System is a **web-based asset tracking platform** that helps manage IT equipment across departments and remote SACCO branches.

## Core Features at a Glance

### 🔐 Authentication
- Secure login with encrypted passwords
- Role-based access (Admin/User)

### 📦 Inventory Management
- Track all IT equipment (laptops, desktops, servers, etc.)
- Auto-generated asset numbers per department
- Search by asset number, serial, type, manufacturer
- Link replacement items to old equipment

### 🔧 Maintenance Tracking
- Log repairs and maintenance activities
- Send equipment to ICT for repair
- Track repair status and return
- Department-wide maintenance sweeps

### 🚚 Transfer Management
Complete lifecycle tracking:
1. **ICT sends** → item to Records
2. **Records receives** → confirms receipt
3. **Records ships** → to branch (with tracking)
4. **Branch receives** → acknowledges delivery

### 📊 Reports & Analytics
- Inventory reports by department
- Dashboard statistics
- Recent activity tracking
- Transfer history

## Key User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access, reports, user management |
| **ICT Staff** | Add inventory, manage repairs, initiate transfers |
| **Records** | Receive items, ship to branches, track shipments |
| **Department Users** | View departmental assets, log maintenance |
| **Branch Staff** | Receive equipment, report issues |

## Common Tasks

### Add New Equipment
1. Login → Inventory → Add Inventory
2. Fill details (type, serial, manufacturer, model, department)
3. Submit (asset number auto-generated)

### Log Maintenance
1. Login → Maintenance → Log Maintenance
2. Enter equipment details, tag number, technician
3. Submit

### Transfer Equipment
1. Login → Transfers → New Transfer
2. Select item, destination, add notes
3. Submit → Records receives → Ships → Branch acknowledges

### Generate Report
1. Login as Admin → Reports
2. Select department or "All"
3. View/Export

## API Quick Reference

### Authentication
- `POST /api/register` - Create account
- `POST /api/login` - Login
- `POST /api/logout` - Logout

### Inventory
- `GET /api/inventory` - List all items
- `GET /api/inventory/:id` - Get item details
- `POST /api/inventory` - Add new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Remove item

### Maintenance
- `GET /api/maintenance` - List records
- `POST /api/maintenance` - Create record
- `POST /api/maintenance/:id/send-to-ict` - Send for repair
- `POST /api/maintenance/:id/mark-returned` - Mark returned

### Transfers
- `GET /api/transfers` - List transfers
- `POST /api/transfers` - Create transfer
- `POST /api/transfers/:id/receive-records` - Records receives
- `POST /api/transfers/:id/ship` - Ship to destination
- `POST /api/transfers/:id/acknowledge` - Confirm delivery

### Other
- `GET /api/departments` - List departments
- `GET /api/search?q=query` - Search inventory
- `GET /api/reports/inventory?department=DEPT` - Generate report

## Technology Stack

**Backend**: Node.js, Express, SQLite  
**Frontend**: React, Bootstrap  
**Security**: Bcrypt password hashing, session-based auth

## Getting Started

### Run Locally
```bash
# Backend (Terminal 1)
cd server
npm install
node index.js  # Port 4000

# Frontend (Terminal 2)
cd client
npm install
npm start      # Port 3000
```

### Access
Open browser: `http://localhost:3000`

## Default Departments

- UNASSIGNED
- BANK
- CENTRAL OPERATIONS
- CUSTOMER EXPERIENCE
- RECORDS
- FINANCE
- REGISTRY
- HR
- CREDIT & LOANS
- AUDITING

## Support

For help or questions, contact MWALIMU Towers ICT team.

---

**Version**: 1.0  
**Last Updated**: 2025  
**Organization**: MWALIMU Towers SACCO
