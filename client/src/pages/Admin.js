import React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const Admin = () => {
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [reportType, setReportType] = useState('inventory');
  const [reportData, setReportData] = useState([]);
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
      const [usersRes, inventoryRes, maintenanceRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/inventory'),
        fetch('/api/maintenance')
      ]);
      setUsers(await usersRes.json());
      setInventory(await inventoryRes.json());
      setMaintenance(await maintenanceRes.json());
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
    <div className="container py-5">
      <div className="mb-3">
        <Link to="/" className="btn btn-outline-secondary"><i className="bi bi-arrow-left"></i> Back to Home</Link>
      </div>
      <h2 className="fw-bold mb-4 text-center" style={{color:'#1b5e20'}}>Admin Dashboard</h2>
      {/* Summary Bar */}
      <div className="row mb-4 justify-content-center">
        <div className="col-md-4">
          <div className="card shadow text-center">
            <div className="card-body">
              <i className="bi bi-people display-5 text-primary mb-2"></i>
              <h5>Users</h5>
              <p className="fs-3 fw-bold">{loading ? '...' : users.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow text-center">
            <div className="card-body">
              <i className="bi bi-box-seam display-5 text-success mb-2"></i>
              <h5>Devices</h5>
              <p className="fs-3 fw-bold">{loading ? '...' : inventory.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow text-center">
            <div className="card-body">
              <i className="bi bi-tools display-5 text-warning mb-2"></i>
              <h5>Maintenance</h5>
              <p className="fs-3 fw-bold">{loading ? '...' : maintenance.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive grid for features */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card shadow h-100">
            <div className="card-body">
              <h4 className="fw-bold mb-2"><i className="bi bi-people text-primary"></i> Manage Users</h4>
              <table className="table table-sm table-bordered">
                <thead><tr><th>Username</th><th>Role</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}><td>{u.username}</td><td>{u.role}</td></tr>
                  ))}
                </tbody>
              </table>
              <Link to="/register" className="btn btn-primary btn-sm">Add User</Link>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow h-100">
            <div className="card-body">
              <h4 className="fw-bold mb-2"><i className="bi bi-box-seam text-success"></i> Devices</h4>
              <table className="table table-sm table-bordered">
                <thead><tr><th>Name</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {inventory.map(d => (
                    <tr key={d.id}><td>{d.item_name}</td><td>{d.item_type}</td><td>{d.status}</td></tr>
                  ))}
                </tbody>
              </table>
              <Link to="/inventory" className="btn btn-success btn-sm">Add/View Devices</Link>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow h-100">
            <div className="card-body">
              <h4 className="fw-bold mb-2"><i className="bi bi-tools text-warning"></i> Maintenance</h4>
              <table className="table table-sm table-bordered">
                <thead><tr><th>Date</th><th>Equipment</th><th>User</th></tr></thead>
                <tbody>
                  {maintenance.map(m => (
                    <tr key={m.id}><td>{m.date}</td><td>{m.equipment}</td><td>{m.user}</td></tr>
                  ))}
                </tbody>
              </table>
              <Link to="/maintenance" className="btn btn-warning btn-sm">Add/View Maintenance</Link>
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
                        {reportType==='inventory' && <><th>Name</th><th>Type</th><th>Status</th></>}
                        {reportType==='maintenance' && <><th>Date</th><th>Equipment</th><th>User</th></>}
                        {reportType==='users' && <><th>Username</th><th>Role</th></>}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r,i) => (
                        <tr key={i}>
                          {reportType==='inventory' && <><td>{r.item_name}</td><td>{r.item_type}</td><td>{r.status}</td></>}
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
  );
};

export default Admin;