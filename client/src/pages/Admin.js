import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
const Admin = () => {
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [reportType, setReportType] = useState('inventory');
  const [reportData, setReportData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setAccessDenied(true);
      navigate('/login');
      return;
    }
    async function fetchData() {
      setLoading(true);
      try {
        const [usersRes, inventoryRes, maintenanceRes] = await Promise.all([
          fetch('/api/users', { credentials: 'include' }),
          fetch('/api/inventory', { credentials: 'include' }),
          fetch('/api/maintenance', { credentials: 'include' })
        ]);
        // Handle session expiration or forbidden
        if (usersRes.status === 401 || usersRes.status === 403 || inventoryRes.status === 401 || inventoryRes.status === 403 || maintenanceRes.status === 401 || maintenanceRes.status === 403) {
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        const usersData = usersRes.ok ? await usersRes.json() : [];
        const inventoryData = inventoryRes.ok ? await inventoryRes.json() : [];
        const maintenanceData = maintenanceRes.ok ? await maintenanceRes.json() : [];
        // fetch departments
        let depts = [];
        try {
          const dres = await fetch('/api/departments', { credentials: 'include' });
          if (dres.ok) depts = await dres.json();
        } catch (e) { depts = []; }
        setUsers(Array.isArray(usersData) ? usersData : []);
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
        setMaintenance(Array.isArray(maintenanceData) ? maintenanceData : []);
        setDepartments(Array.isArray(depts) ? depts : []);
      } catch (err) {
        setUsers([]);
        setInventory([]);
        setMaintenance([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [navigate, user]);

  if (accessDenied) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">Access denied. Admins only.</div>
      </div>
    );
  }

  // Report generator
  const handleReport = () => {
    let data = [];
    if (reportType === 'inventory') data = inventory;
    else if (reportType === 'maintenance') data = maintenance;
    else data = users;
    setReportData(data);
  };

  return (
    <div className="admin-dashboard d-flex" style={{minHeight:'100vh',background:'#f7f9fa'}}>
      {/* Sidebar */}
      <nav className={`sidebar bg-white shadow-sm ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`} style={{width:sidebarOpen?'220px':'60px',transition:'width 0.2s'}}>
        <div className="d-flex flex-column align-items-center py-3">
          <button className="btn btn-light mb-4" onClick={()=>setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar">
            <i className={`bi ${sidebarOpen?'bi-chevron-left':'bi-chevron-right'}`}></i>
          </button>
          <Link to="/admin" className="mb-3"><i className="bi bi-speedometer2 fs-4"></i>{sidebarOpen && <span className="ms-2">Dashboard</span>}</Link>
          <Link to="/inventory" className="mb-3"><i className="bi bi-box-seam fs-4"></i>{sidebarOpen && <span className="ms-2">Inventory</span>}</Link>
          <Link to="/maintenance" className="mb-3"><i className="bi bi-tools fs-4"></i>{sidebarOpen && <span className="ms-2">Maintenance</span>}</Link>
          <Link to="/reports" className="mb-3"><i className="bi bi-bar-chart-line fs-4"></i>{sidebarOpen && <span className="ms-2">Reports</span>}</Link>
          <Link to="/users" className="mb-3"><i className="bi bi-people fs-4"></i>{sidebarOpen && <span className="ms-2">Users</span>}</Link>
          <Link to="/settings" className="mb-3"><i className="bi bi-gear fs-4"></i>{sidebarOpen && <span className="ms-2">Settings</span>}</Link>
        </div>
      </nav>
      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <h2 className="fw-bold mb-4 text-center" style={{color:'#1b5e20'}}>Admin Dashboard</h2>
        {/* Card Metrics */}
        <div className="row mb-4 justify-content-center">
          <div className="col-md-4 mb-3">
            <div className="card shadow text-center">
              <div className="card-body">
                <i className="bi bi-people display-5 text-primary mb-2"></i>
                <h5>Users</h5>
                <p className="fs-3 fw-bold">{loading ? 'Loading...' : (typeof users.length === 'number' ? users.length : 0)}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card shadow text-center">
              <div className="card-body">
                <i className="bi bi-box-seam display-5 text-success mb-2"></i>
                <h5>Devices</h5>
                <p className="fs-3 fw-bold">{loading ? 'Loading...' : (typeof inventory.length === 'number' ? inventory.length : 0)}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card shadow text-center">
              <div className="card-body">
                <i className="bi bi-tools display-5 text-warning mb-2"></i>
                <h5>Maintenance</h5>
                <p className="fs-3 fw-bold">{loading ? 'Loading...' : (typeof maintenance.length === 'number' ? maintenance.length : 0)}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Error message if no data */}
        {(!loading && users.length === 0 && inventory.length === 0 && maintenance.length === 0) && (
          <div className="alert alert-warning text-center">No data found or you may not have access.</div>
        )}
        {/* Features Grid */}
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card shadow h-100">
              <div className="card-body">
                <h4 className="fw-bold mb-2"><i className="bi bi-people text-primary"></i> Manage Users</h4>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead><tr><th>Username</th><th>Role</th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}><td>{u.username}</td><td>{u.role}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link to="/register" className="btn btn-primary btn-sm">Add User</Link>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow h-100">
              <div className="card-body">
                <h4 className="fw-bold mb-2"><i className="bi bi-box-seam text-success"></i> Devices</h4>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead><tr><th>Asset No</th><th>Asset Type</th><th>Serial No</th><th>Manufacturer</th><th>Model</th><th>Version</th><th>Status</th></tr></thead>
                    <tbody>
                      {inventory.map(d => (
                        <tr key={d.id}>
                          <td>{d.asset_no}</td>
                          <td>{d.asset_type}</td>
                          <td>{d.serial_no}</td>
                          <td>{d.manufacturer}</td>
                          <td>{d.model}</td>
                          <td>{d.version}</td>
                          <td>{d.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link to="/inventory" className="btn btn-success btn-sm">Add/View Devices</Link>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow h-100">
              <div className="card-body">
                <h4 className="fw-bold mb-2"><i className="bi bi-tools text-warning"></i> Maintenance</h4>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead><tr><th>Date</th><th>Equipment</th><th>User</th></tr></thead>
                    <tbody>
                      {maintenance.map(m => (
                        <tr key={m.id}><td>{m.date}</td><td>{m.equipment}</td><td>{m.user}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link to="/maintenance" className="btn btn-warning btn-sm">Add/View Maintenance</Link>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow h-100">
              <div className="card-body">
                <h4 className="fw-bold mb-2"><i className="bi bi-list-ul text-secondary"></i> Departments</h4>
                <div className="mb-3">
                  <div style={{maxHeight:'200px',overflowY:'auto'}}>
                    <table className="table table-sm table-bordered">
                      <thead><tr><th>Name</th></tr></thead>
                      <tbody>
                        {departments.map(d => (
                          <tr key={d.id}><td>{d.name}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="d-flex">
                  <input className="form-control form-control-sm me-2" value={newDept} onChange={e=>setNewDept(e.target.value)} placeholder="New department name" />
                  <button className="btn btn-secondary btn-sm" onClick={async ()=>{
                    if (!newDept || newDept.trim().length<1) return;
                    try {
                      const res = await fetch('/api/departments', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: newDept.trim() }) });
                      if (res.ok) {
                        const nd = await res.json();
                        setDepartments(prev=>[...prev, nd]);
                        setNewDept('');
                      } else {
                        alert('Failed to add department');
                      }
                    } catch (e) { alert('Error adding department'); }
                  }}>Add</button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow h-100">
              <div className="card-body">
                <h4 className="fw-bold mb-2"><i className="bi bi-bar-chart-line text-info"></i> Reports</h4>
                <div className="mb-2">
                  <select className="form-select form-select-sm w-50 d-inline" value={reportType} onChange={e=>setReportType(e.target.value)}>
                    <option value="inventory">Inventory</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="users">Users</option>
                  </select>
                  <button className="btn btn-info btn-sm ms-2" onClick={handleReport}>Generate</button>
                </div>
                {reportData.length > 0 && (
                  <div style={{maxHeight:'200px',overflowY:'auto'}}>
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          {reportType==='inventory' && <><th>Asset No</th><th>Asset Type</th><th>Serial No</th><th>Manufacturer</th><th>Model</th><th>Version</th><th>Status</th></>}
                          {reportType==='maintenance' && <><th>Date</th><th>Equipment</th><th>User</th></>}
                          {reportType==='users' && <><th>Username</th><th>Role</th></>}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((r,i) => (
                          <tr key={i}>
                            {reportType==='inventory' && <>
                              <td>{r.asset_no}</td>
                              <td>{r.asset_type}</td>
                              <td>{r.serial_no}</td>
                              <td>{r.manufacturer}</td>
                              <td>{r.model}</td>
                              <td>{r.version}</td>
                              <td>{r.status}</td>
                            </>}
                            {reportType==='maintenance' && <><td>{r.date}</td><td>{r.equipment}</td><td>{r.user}</td></>}
                            {reportType==='users' && <><td>{r.username}</td><td>{r.role}</td></>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;