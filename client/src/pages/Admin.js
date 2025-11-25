import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Tailwind/TailAdmin-styled Admin page: lists users and allows promote/demote
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users and roles</p>
        </div>
        <div className="text-sm text-gray-600">Signed in as <span className="font-medium">{currentUser?.username}</span></div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-800">Users</h2>
        </div>
        <div className="p-6">
          {error && <div className="mb-4 rounded-md bg-red-50 border border-red-100 text-red-700 px-4 py-3">{error}</div>}

          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '6%'}}>ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '16%'}}>Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '18%'}}>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {u.role !== 'admin' ? (
                          <button className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600" onClick={() => changeRole(u.id, 'admin')}>Promote</button>
                        ) : (
                          <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded hover:bg-gray-50" onClick={() => changeRole(u.id, 'user')}>Demote</button>
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