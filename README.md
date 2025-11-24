
# MWALIMU Towers ICT Management System

## Overview
This web application is designed for MWALIMU Towers ICT and Records teams to manage inventory, maintenance, transfers, and reporting for ICT assets and equipment. It streamlines asset tracking, department handovers, and accountability across the organization.

📚 **Documentation**:
- [**SYSTEM_DOCUMENTATION.md**](SYSTEM_DOCUMENTATION.md) - Complete technical documentation (19KB)
- [**QUICK_REFERENCE.md**](QUICK_REFERENCE.md) - Quick reference guide (4KB)

## Features

- **User Authentication**: Secure login and registration for staff and admins.
- **Inventory Management**: Add, view, and manage ICT assets by department. Live-updating lists per department.
- **Maintenance Logging**: Record and review maintenance activities for equipment.
- **Departmental Transfers**: ICT team can send assets to Records, which then ships to remote SACCOs or other destinations (e.g., Mombasa, Kapenguria). Full lifecycle tracking:
	- Sent by ICT
	- Received by Records
	- Shipped to destination (with tracking info)
	- Received/acknowledged at destination
- **Reports**: Generate inventory reports by department or for all assets.
- **Role-based Access**: Admins have dashboard access and can view all data; Records and ICT have department-specific controls.

## How It Works

1. **Inventory**: ICT staff add new assets, assign to departments, and view live lists.
2. **Maintenance**: Log maintenance events for any asset.
3. **Transfers**: ICT initiates a transfer to Records; Records confirms receipt, ships to destination, and destination acknowledges delivery.
4. **Reports**: Generate and export reports for assets and transfers.

## Roadmap / Planned Features

- **Email Notifications**: Automated emails for transfer events (sent, shipped, delivered).
- **Admin Controls**: Approve transfers, export data, and manage users.
- **Role-based UI**: Custom dashboards for ICT, Records, and Admins.
- **Mobile-friendly Design**: Responsive UI for phones and tablets.
- **Audit Trail**: Full history of asset movements and actions.
- **Export to PDF/Excel**: Download reports and transfer logs.
- **Notifications**: In-app alerts for pending actions and status changes.
- **Integration**: Connect with external SACCO systems for automated updates.


## Getting Started

### 1. Clone the repository
```bash
git clone <repo-url>
cd ICT
```

### 2. Install dependencies
```bash
# In the server folder
cd server
npm install

# In the client folder
cd ../client
npm install
```

### 3. Start the servers
```bash
# Start backend (from server folder)
cd ../server
node index.js

# Start frontend (from client folder)
cd ../client
npm start
```

### 4. Access the app
Open your browser and go to:
```
http://localhost:3000
```

### 5. Default credentials
- Register a new user or ask admin for access.

---

## Technologies Used

- React (frontend)
- Bootstrap (UI)
- Node.js & Express (backend)
- SQLite (database)

---
For questions or demo access, contact the MWALIMU Towers ICT team.