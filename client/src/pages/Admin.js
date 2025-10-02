
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is admin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || user.role !== 'admin') {
    // Not admin, redirect to login
    setTimeout(() => navigate('/login'), 100);
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">Access denied. Admins only.</div>
      </div>
    );
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [usersRes, inventoryRes, maintenanceRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/inventory'),
        fetch('/api/maintenance')
      ]);
      const usersData = await usersRes.json();
      const inventoryData = await inventoryRes.json();
      const maintenanceData = await maintenanceRes.json();
      setUsers(usersData);
      setInventoryCount(Array.isArray(inventoryData) ? inventoryData.length : 0);
      setMaintenanceCount(Array.isArray(maintenanceData) ? maintenanceData.length : 0);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="container py-5">
      <h2 className="mb-4">Admin Dashboard</h2>
      {/* ...existing dashboard code... */}
      <div className="row mb-4">
        {/* ...existing cards... */}
        <div className="col-md-4">
          <div className="card text-center shadow">
            <div className="card-body">
              <i className="bi bi-people display-4 text-primary mb-2"></i>
              <h5 className="card-title">Users</h5>
              <p className="card-text fs-3 fw-bold">{loading ? '...' : users.length}</p>
              <Link to="/admin" className="btn btn-primary btn-sm">Manage Users</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center shadow">
            <div className="card-body">
              <i className="bi bi-box-seam display-4 text-success mb-2"></i>
              <h5 className="card-title">Inventory Items</h5>
              <p className="card-text fs-3 fw-bold">{loading ? '...' : inventoryCount}</p>
              <Link to="/inventory" className="btn btn-success btn-sm">View Inventory</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center shadow">
            <div className="card-body">
              <i className="bi bi-tools display-4 text-warning mb-2"></i>
              <h5 className="card-title">Maintenance Records</h5>
              <p className="card-text fs-3 fw-bold">{loading ? '...' : maintenanceCount}</p>
              <Link to="/maintenance" className="btn btn-warning btn-sm">View Maintenance</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-body">
          <h4 className="mb-3">User Management</h4>
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>
                      <RoleEditor user={u} onRoleChange={role => handleRoleChange(u.id, role)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Handle role change in local state
  const handleRoleChange = (id, newRole) => {
    setUsers(users => users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

};

// Role editor component
function RoleEditor({ user, onRoleChange }) {
  const [role, setRole] = useState(user.role);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    setUpdating(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        onRoleChange(role);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update role');
      }
    } catch {
      setError('Server error');
    }
    setUpdating(false);
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <select className="form-select form-select-sm" value={role} onChange={e => setRole(e.target.value)} disabled={updating}>
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleUpdate} disabled={updating || role === user.role}>
        Update
      </button>
      {error && <span className="text-danger ms-2 small">{error}</span>}
    </div>
  );
}

export default Admin;
