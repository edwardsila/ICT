# MWALIMU Towers ICT Management System - Complete Documentation

## Executive Summary

The MWALIMU Towers ICT Management System is a comprehensive web-based application designed to manage IT assets, maintenance activities, and equipment transfers across the MWALIMU SACCO organization. It provides end-to-end tracking of ICT equipment from procurement through deployment, maintenance, transfers, and eventual replacement.

## Table of Contents

1. [System Overview](#system-overview)
2. [Key Features](#key-features)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Core Modules](#core-modules)
5. [Technical Architecture](#technical-architecture)
6. [Database Design](#database-design)
7. [API Documentation](#api-documentation)
8. [Security Implementation](#security-implementation)
9. [Deployment Guide](#deployment-guide)
10. [Usage Workflows](#usage-workflows)

---

## System Overview

### Purpose
The system streamlines asset tracking, department handovers, and accountability across the MWALIMU organization, including:
- Head office (MWALIMU Towers)
- Remote SACCO branches (Mombasa, Kapenguria, etc.)
- Multiple departments (IT, Records, Finance, HR, etc.)

### Target Users
- **ICT Team**: Asset management and technical support
- **Records Department**: Logistics and shipping coordination
- **Department Heads**: Departmental asset tracking
- **Administrators**: System oversight and reporting
- **Branch Managers**: Remote location equipment receipt

---

## Key Features

### 1. Inventory Management
- **Asset Registration**: Complete asset details including asset number, type, serial number, manufacturer, model, version, OS information
- **Automatic Asset Numbering**: Sequential numbering per department (e.g., BANK-00001, HR-00023)
- **Department Assignment**: Link assets to specific departments
- **Asset Status Tracking**: Active, In Repair, Replaced, etc.
- **Search & Filter**: Find assets by any attribute
- **Asset Replacement Tracking**: Link new items to old items being replaced
- **Received Date Tracking**: Track when assets were added to inventory

### 2. Maintenance Tracking
- **Maintenance Logging**: Record maintenance activities with date, equipment, user
- **Repair Workflow**: 
  - Department reports issue
  - Send to ICT for repair
  - ICT processes repair
  - Return to department
- **Repair Status**: Track repair progress and notes
- **Department-Level Maintenance**: Track maintenance sweeps across entire departments
- **Progress Tracking**: Monitor maintenance completion percentage
- **Non-Maintained Equipment**: Track equipment that couldn't be serviced

### 3. Transfer Management

#### Transfer Lifecycle:
1. **Initiated**: ICT sends item to Records
2. **Received by Records**: Records confirms receipt
3. **Shipped**: Records ships to destination with tracking info
4. **Delivered**: Destination acknowledges receipt

#### Transfer Types:
- **Internal Transfers**: Between departments in head office
- **Branch Repairs**: Equipment sent from branches for repair
- **Branch Shipments**: New/repaired equipment sent to branches

#### Replacement Workflow:
- Track faulty equipment sent from branches
- Process repair or replacement at head office
- Ship replacement equipment back to branch
- Link replacement items to original faulty items

### 4. Reporting & Analytics
- **Inventory Reports**: By department or organization-wide
- **Dashboard Statistics**:
  - Total assets
  - Items in repair
  - Pending transfers
- **Recent Activity**: View recently added items
- **Transfer Tracking**: Monitor all equipment movements

### 5. User Management
- **Secure Authentication**: Bcrypt password hashing
- **Role-Based Access**: Admin and user roles
- **Session Management**: Secure session handling
- **User Registration**: New user account creation

---

## User Roles and Permissions

### Admin Role
- Full system access
- View all inventory and transfers
- Generate reports
- Create departments
- Access admin dashboard
- View all maintenance records

### User Role
- Add and manage inventory
- Log maintenance activities
- Create and track transfers
- View assigned department data
- Search inventory

---

## Core Modules

### 1. Authentication Module (`/api/login`, `/api/register`, `/api/logout`)
- User registration with username and password
- Secure login with session creation
- Password validation (6-50 characters)
- Username validation (3-20 alphanumeric)

### 2. Inventory Module (`/api/inventory/*`)

#### Endpoints:
- `GET /api/inventory` - List all inventory (filterable by department)
- `GET /api/inventory/:id` - Get specific item
- `GET /api/inventory/by-tag?tag=XXX` - Search by asset number or serial
- `GET /api/inventory/recent?limit=N` - Get recently added items
- `POST /api/inventory` - Add new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Remove item

#### Asset Fields:
- `asset_no`: Unique asset identifier (auto-generated or manual)
- `asset_type`: Type of equipment (Laptop, Desktop, Server, etc.)
- `serial_no`: Manufacturer serial number
- `manufacturer`: Equipment manufacturer
- `model`: Model name/number
- `version`: Version or generation
- `os_info`: Operating system details
- `status`: Current status (Active, In Repair, Replaced)
- `department`: Assigned department
- `received_at`: When added to inventory
- `replacement_of`: ID of item this replaces
- `replaced_by`: ID of item that replaced this one

### 3. Maintenance Module (`/api/maintenance/*`)

#### Endpoints:
- `GET /api/maintenance` - List all maintenance records
- `GET /api/maintenance/:id` - Get specific record
- `POST /api/maintenance` - Create new record
- `POST /api/maintenance/department` - Create department-level maintenance
- `POST /api/maintenance/:id/send-to-ict` - Mark item sent for repair
- `POST /api/maintenance/:id/mark-returned` - Mark item returned
- `PUT /api/maintenance/:id` - Update record
- `DELETE /api/maintenance/:id` - Remove record

#### Maintenance Fields:
- `date`: Maintenance date
- `equipment`: Equipment description
- `tagnumber`: Asset tag number
- `department`: Department
- `equipment_model`: Equipment model
- `user`: Person performing maintenance
- `inventory_id`: Linked inventory item
- `sent_to_ict`: Boolean flag
- `sent_to_ict_at`: When sent to ICT
- `returned`: Boolean flag
- `returned_at`: When returned
- `repair_notes`: Repair details
- `repair_status`: Current repair status
- `start_date`: Maintenance period start
- `end_date`: Maintenance period end
- `progress`: Completion percentage (0-100)
- `dept_status`: Department maintenance status
- `machines_not_maintained`: Count of unmaintained equipment

### 4. Transfer Module (`/api/transfers/*`)

#### Endpoints:
- `GET /api/transfers` - List transfers (filterable by status)
- `GET /api/transfers/:id` - Get specific transfer
- `POST /api/transfers` - Create new transfer
- `POST /api/transfers/:id/receive-records` - Records receives item
- `POST /api/transfers/:id/ship` - Records ships to destination
- `POST /api/transfers/:id/acknowledge` - Destination confirms receipt
- `POST /api/transfers/:id/receive-ict` - ICT receives item
- `POST /api/transfers/:id/complete-replacement` - Complete replacement workflow

#### Transfer Fields:
- `inventory_id`: Item being transferred
- `from_department`: Source department
- `to_department`: Destination department
- `destination`: Remote location (if applicable)
- `transfer_type`: Type of transfer (internal, branch_repair, etc.)
- `sent_by`: User who initiated transfer
- `sent_at`: Transfer initiation time
- `status`: Current status (Sent, ReceivedByRecords, Shipped, Delivered, Replaced, etc.)
- `notes`: Transfer notes
- `records_received_by`: Records team member
- `records_received_at`: When Records received
- `records_notes`: Records team notes
- `shipped_by`: Who shipped the item
- `shipped_at`: Shipment time
- `tracking_info`: Shipping tracking number
- `destination_received_by`: Receiver at destination
- `destination_received_at`: Delivery time
- `date_received`: Branch receipt date
- `date_sent`: Branch send date
- `repaired_status`: Repair outcome (Repaired, Replaced, Unrepairable)
- `repaired_by`: Technician who handled repair
- `repair_comments`: Repair details
- `received_by`: Person who received item
- `issue_comments`: Issue description from branch
- `replacement_inventory_id`: ID of replacement item

### 5. Department Module (`/api/departments`)

#### Endpoints:
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create new department (admin only)

#### Default Departments:
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

### 6. Search Module (`/api/search`)

#### Endpoint:
- `GET /api/search?q=query&limit=N` - Search inventory

#### Search Criteria:
- Asset number
- Asset type
- Serial number
- Manufacturer
- Model

Returns formatted suggestions with title and subtitle.

### 7. Reports Module (`/api/reports/*`)

#### Endpoints:
- `GET /api/reports/inventory?department=DEPT` - Generate inventory report

---

## Technical Architecture

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express 5.1.0
- **Database**: SQLite3 5.1.7
- **Authentication**: bcrypt 6.0.0
- **CORS**: cors 2.8.5
- **Session**: express-session 1.18.2

### Frontend Stack
- **Framework**: React 19.1.1
- **Router**: react-router-dom 7.9.3
- **UI Library**: Bootstrap 5.3.8
- **Icons**: bootstrap-icons 1.13.1
- **Build Tool**: react-scripts 5.0.1 (Create React App)
- **PWA**: Progressive Web App enabled

### Communication
- RESTful API
- JSON data format
- Session-based authentication with cookies
- Proxy configuration (frontend → backend on port 4000)

---

## Database Design

### Tables

#### 1. users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
);
```

#### 2. inventory
```sql
CREATE TABLE inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_no TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    serial_no TEXT,
    manufacturer TEXT,
    model TEXT,
    version TEXT,
    status TEXT NOT NULL,
    department TEXT NOT NULL,
    os_info TEXT,
    replacement_of INTEGER,
    received_at TEXT,
    replaced_by INTEGER
);
```

#### 3. maintenance
```sql
CREATE TABLE maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    equipment TEXT NOT NULL,
    tagnumber TEXT NOT NULL,
    department TEXT NOT NULL,
    equipment_model TEXT NOT NULL,
    user TEXT NOT NULL,
    inventory_id INTEGER,
    sent_to_ict INTEGER DEFAULT 0,
    sent_to_ict_at TEXT,
    returned INTEGER DEFAULT 0,
    returned_at TEXT,
    repair_notes TEXT,
    repair_status TEXT,
    start_date TEXT,
    end_date TEXT,
    progress INTEGER DEFAULT 0,
    dept_status TEXT,
    machines_not_maintained INTEGER DEFAULT 0
);
```

#### 4. transfers
```sql
CREATE TABLE transfers (
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
    date_received TEXT,
    date_sent TEXT,
    transfer_type TEXT,
    repaired_status TEXT,
    repaired_by TEXT,
    repair_comments TEXT,
    received_by TEXT,
    issue_comments TEXT,
    replacement_inventory_id INTEGER,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);
```

#### 5. departments
```sql
CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);
```

#### 6. asset_counters
```sql
CREATE TABLE asset_counters (
    department TEXT UNIQUE NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0
);
```

---

## Security Implementation

### Password Security
- Bcrypt hashing with 10 salt rounds
- Password requirements: 6-50 characters
- Hashed passwords stored in database

### Authentication
- Session-based authentication
- Session secret: 'ict_secret_key' (should be environment variable in production)
- Session timeout: 1 hour (3600000 ms)
- Secure cookie configuration

### Input Validation
- Username: 3-20 alphanumeric characters
- Password: 6-50 characters
- String fields: Length validation (1-200 characters)
- SQL injection prevention via parameterized queries

### Authorization
- `requireLogin` middleware protects all API endpoints
- Admin-only operations verified via role check
- Session user information checked for ownership

### CORS Configuration
- Origin: true (allows credentials)
- Credentials: true (allows cookies)

---

## Deployment Guide

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation Steps

#### 1. Clone Repository
```bash
git clone <repo-url>
cd ICT
```

#### 2. Install Backend Dependencies
```bash
cd server
npm install
```

#### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

#### 4. Start Backend Server
```bash
cd ../server
node index.js
# Server runs on port 4000
```

#### 5. Start Frontend Development Server
```bash
cd ../client
npm start
# Client runs on port 3000
```

#### 6. Access Application
```
http://localhost:3000
```

### Production Deployment

#### Backend
```bash
cd server
# Set PORT environment variable if needed
export PORT=4000
node index.js
```

#### Frontend
```bash
cd client
npm run build
# Serve build folder with Express static middleware
# or deploy to static hosting (Netlify, Vercel, etc.)
```

---

## Usage Workflows

### Workflow 1: Adding New Equipment

1. **Login** as ICT staff
2. Navigate to **Inventory** page
3. Click **Add Inventory**
4. Fill in asset details:
   - Asset type (required)
   - Serial number
   - Manufacturer
   - Model
   - Version
   - OS information
   - Department assignment
5. **Submit** - System auto-generates asset number
6. Item appears in department inventory

### Workflow 2: Logging Maintenance

1. **Login** as any user
2. Navigate to **Maintenance** page
3. Click **Log Maintenance**
4. Select equipment (or enter manually)
5. Fill in maintenance details:
   - Date
   - Equipment description
   - Tag number
   - Department
   - Technician name
6. **Submit** - Record created

### Workflow 3: Sending Equipment for Repair

1. **Login** as department user
2. Go to **Maintenance** page
3. Find maintenance record
4. Click **Send to ICT**
5. Add repair notes
6. **Submit** - Item marked as sent to ICT
7. ICT team receives notification

### Workflow 4: Transfer to Remote Branch

#### Step 1: ICT Initiates Transfer
1. **Login** as ICT staff
2. Go to **Transfers** page
3. Click **New Transfer**
4. Select inventory item
5. Set destination (e.g., "Mombasa SACCO")
6. Add transfer notes
7. **Submit** - Transfer created with status "Sent"

#### Step 2: Records Receives
1. **Login** as Records staff
2. View pending transfers
3. Click **Receive** on transfer
4. Verify item received
5. Add notes
6. **Submit** - Status changes to "ReceivedByRecords"

#### Step 3: Records Ships
1. Records staff clicks **Ship**
2. Enter destination details
3. Add tracking information
4. **Submit** - Status changes to "Shipped"

#### Step 4: Branch Acknowledges
1. **Login** as branch staff
2. View incoming shipments
3. Click **Acknowledge Receipt**
4. Enter receiver name
5. **Submit** - Status changes to "Delivered"

### Workflow 5: Branch Repair with Replacement

#### Step 1: Branch Reports Issue
1. **Login** as branch staff
2. Create transfer for faulty equipment
3. Set transfer type: "Branch Repair"
4. Describe issue in comments
5. Set destination: "ICT Head Office"
6. **Submit** - Transfer created

#### Step 2: ICT Receives Faulty Item
1. **Login** as ICT staff
2. View pending transfers
3. Click **Receive at ICT**
4. **Submit** - Item moved to ICT department

#### Step 3: ICT Processes Repair/Replacement
1. Evaluate equipment
2. Click **Complete Replacement**
3. Choose:
   - **Use existing item**: Select from inventory
   - **Create new item**: Enter details
4. **Submit** - System:
   - Marks old item as replaced
   - Assigns replacement to original department
   - Updates transfer status

#### Step 4: Records Ships Replacement
1. Records receives replacement
2. Ships to branch
3. Branch acknowledges receipt
4. Workflow complete

### Workflow 6: Department Maintenance Sweep

1. **Login** as maintenance staff
2. Navigate to **Maintenance** page
3. Click **Department Maintenance**
4. Select department
5. Set date range
6. Choose:
   - **All devices**: Create record for each
   - **Specific devices**: Select from list
   - **Single record**: Department-wide entry
7. Track progress (percentage complete)
8. Note non-maintained machines
9. **Submit** - Records created

### Workflow 7: Generating Reports

1. **Login** as administrator
2. Navigate to **Reports** page
3. Select report type:
   - All inventory
   - By department
   - Transfer history
4. Click **Generate**
5. View or export report

---

## Future Enhancements (Roadmap)

### Planned Features
- **Email Notifications**: Automated alerts for transfer events
- **Enhanced Admin Controls**: User management, approval workflows
- **Role-based Dashboards**: Custom views for ICT, Records, Admins
- **Mobile-Responsive Design**: Optimized for tablets and phones
- **Complete Audit Trail**: Full history of all asset movements
- **Export Capabilities**: PDF and Excel report generation
- **In-App Notifications**: Real-time alerts for pending actions
- **External Integration**: Connect with SACCO systems for automated updates
- **Advanced Search**: Filters, saved searches, bulk operations
- **Asset Barcode Support**: QR code generation and scanning
- **Maintenance Schedules**: Preventive maintenance planning
- **Asset Lifecycle Management**: Depreciation tracking
- **Custom Fields**: Configurable asset attributes per organization

---

## Support and Maintenance

For questions, issues, or demo access, contact the MWALIMU Towers ICT team.

### System Requirements
- **Backend**: Node.js 14+, SQLite3
- **Frontend**: Modern browser (Chrome, Firefox, Safari, Edge)
- **Network**: HTTP/HTTPS access to API server

### Troubleshooting

#### Backend Issues
- Check server logs in `server.log`
- Verify database file exists: `server/ict_inventory.db`
- Ensure port 4000 is available

#### Frontend Issues
- Clear browser cache
- Check browser console for errors
- Verify API proxy configuration in `client/package.json`

#### Database Issues
- Backup database regularly
- Check SQLite file permissions
- Run database integrity check: `sqlite3 ict_inventory.db "PRAGMA integrity_check;"`

---

## License

© 2025 MWALIMU Towers ICT System. All rights reserved.

---

*This documentation was generated based on system analysis and code review.*
