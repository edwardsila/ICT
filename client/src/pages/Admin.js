import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
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
      const usersData = await usersRes.json();
      const inventoryData = await inventoryRes.json();
      const maintenanceData = await maintenanceRes.json();
      setUsers(usersData);
      setInventoryCount(Array.isArray(inventoryData) ? inventoryData.length : 0);
      setMaintenanceCount(Array.isArray(maintenanceData) ? maintenanceData.length : 0);
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

  return (
    <div className="container py-5">
      <h2 className="mb-4">Admin Dashboard</h2>
      <div className="row mb-4">
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
    </div>
  );
};

export default Admin;