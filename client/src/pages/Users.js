import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await fetch('/api/users');
        const data = res.ok ? await res.json() : [];
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to fetch users');
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  return (
    <div className="container py-5">
      <div className="mb-3">
        <Link to="/admin" className="btn btn-outline-secondary"><i className="bi bi-arrow-left"></i> Back to Dashboard</Link>
      </div>
      <h2 className="mb-4">Users</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card shadow">
        <div className="card-body">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={3}>No users found.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>
                      <button className="btn btn-sm btn-primary me-2">Edit</button>
                      <button className="btn btn-sm btn-danger">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <button className="btn btn-success mt-3">Add User</button>
        </div>
      </div>
    </div>
  );
};

export default Users;
