import React from 'react';
import { NavLink } from 'react-router-dom';

export default function AdminNav() {
  const items = [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/inventory', label: 'Inventory' },
    { to: '/admin/maintenance', label: 'Maintenance' },
    { to: '/admin/transfers', label: 'Transfers' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/settings', label: 'Settings' },
  ];

  return (
    <nav className="mb-6 bg-white/60 backdrop-blur-sm rounded-md shadow-sm p-3">
      <ul className="flex flex-wrap gap-2 items-center">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end={it.to === '/admin'}
              className={({ isActive }) =>
                `inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {it.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
