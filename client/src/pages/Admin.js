import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Bootstrap-styled Admin page: lists users and allows promote/demote
const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (id, newRole) => {
    setError('');
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to update role');
        return;
      }
      await loadUsers();
    } catch (e) {
      setError('Failed to update role');
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Admin Dashboard</h1>
        <div className="text-muted small">Signed in as <strong>{currentUser?.username}</strong></div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="h5">Users</h2>
          {error && <div className="alert alert-danger mt-3">{error}</div>}

          {loading ? (
            <div className="mt-3">Loading...</div>
          ) : (
            <div className="table-responsive mt-3">
              <table className="table table-hover table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{width: '6%'}}>ID</th>
                    <th>Username</th>
                    <th style={{width: '16%'}}>Role</th>
                    <th style={{width: '18%'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.role}</td>
                      <td>
                        {u.role !== 'admin' ? (
                          <button className="btn btn-sm btn-success me-2" onClick={() => changeRole(u.id, 'admin')}>Promote</button>
                        ) : (
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => changeRole(u.id, 'user')}>Demote</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;