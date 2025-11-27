import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SimpleModal from '../components/SimpleModal';
import { useUser } from '../context/UserContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await fetch('/api/users', { credentials: 'include' });
        if (res.status === 401 || res.status === 403) {
          navigate('/login');
          return;
        }
        const data = res.ok ? await res.json() : [];
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to fetch users');
      }
      setLoading(false);
    }
    fetchUsers();
  }, [navigate]);

  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const changeRole = async (id, role) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
      if (res.status === 401 || res.status === 403) {
        navigate('/login');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed to update role');
        return;
      }
      showToast('Role updated');
      const refreshed = await fetch('/api/users', { credentials: 'include' });
      const data = refreshed.ok ? await refreshed.json() : [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast('Failed to update role');
    }
  };

  const openDelete = (user) => {
    setConfirmTarget(user);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!confirmTarget) return;
    try {
      const res = await fetch(`/api/users/${confirmTarget.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        navigate('/login');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed to delete user');
        setConfirmOpen(false);
        return;
      }
      showToast('User deleted');
      // refresh list
      const refreshed = await fetch('/api/users', { credentials: 'include' });
      const data = refreshed.ok ? await refreshed.json() : [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast('Failed to delete user');
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">Manage system users and roles</p>
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 border rounded-md text-sm" placeholder="Search username..." />
          <Link to="/admin" className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded text-sm hover:bg-gray-50"><i className="bi bi-arrow-left" /> Back</Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-600">Registered users</div>
          {isAdmin && <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add User</button>}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-4 text-sm text-gray-600">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No users found.</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 align-middle">
                      <div className="text-sm font-medium text-gray-900">{u.username}</div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          {u.role !== 'admin' ? (
                            <button onClick={() => changeRole(u.id, 'admin')} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Promote</button>
                          ) : (
                            <button onClick={() => changeRole(u.id, 'user')} className="px-2 py-1 border border-gray-300 rounded text-sm">Demote</button>
                          )}
                          <button onClick={() => openDelete(u)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <div className="fixed right-4 bottom-4 bg-gray-900 text-white px-4 py-2 rounded shadow">{toast}</div>}

      <SimpleModal open={confirmOpen} title="Delete user" onClose={() => setConfirmOpen(false)}>
        <div>
          <p>Are you sure you want to delete user <strong>{confirmTarget?.username}</strong>?</p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={performDelete}>Delete</button>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
};

export default Users;
