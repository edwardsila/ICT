import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const [orgName, setOrgName] = useState('');
  const [theme, setTheme] = useState('light');
  const [password, setPassword] = useState('');

  return (
    <div className="container py-5">
      <div className="mb-3">
        <Link to="/admin" className="btn btn-outline-secondary"><i className="bi bi-arrow-left"></i> Back to Dashboard</Link>
      </div>
      <h2 className="mb-4">Settings</h2>
      <div className="card shadow mb-4">
        <div className="card-body">
          <h4 className="mb-3">Organization Info</h4>
          <div className="mb-3">
            <label className="form-label">Organization Name</label>
            <input type="text" className="form-control" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Enter organization name" />
          </div>
        </div>
      </div>
      <div className="card shadow mb-4">
        <div className="card-body">
          <h4 className="mb-3">Change Password</h4>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" />
          </div>
          <button className="btn btn-primary">Update Password</button>
        </div>
      </div>
      <div className="card shadow">
        <div className="card-body">
          <h4 className="mb-3">Preferences</h4>
          <div className="mb-3">
            <label className="form-label">Theme</label>
            <select className="form-select" value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <button className="btn btn-secondary">Save Preferences</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
