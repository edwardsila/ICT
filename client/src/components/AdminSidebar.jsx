import React from 'react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/admin', label: 'Overview', icon: 'bi-speedometer2' },
  { to: '/admin/users', label: 'Users', icon: 'bi-people', badge: 3 },
  { to: '/admin/inventory', label: 'Inventory', icon: 'bi-box-seam' },
  { to: '/admin/maintenance', label: 'Maintenance', icon: 'bi-tools' },
  { to: '/admin/transfers', label: 'Transfers', icon: 'bi-arrow-left-right' },
  { to: '/admin/reports', label: 'Reports', icon: 'bi-file-earmark-text' },
  { to: '/admin/settings', label: 'Settings', icon: 'bi-gear' },
];

export default function AdminSidebar({ mobileOpen = false, onClose = () => {}, className = '' }) {
  // render desktop sidebar and a slide-over for mobile when mobileOpen
  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex md:flex-col md:w-64 bg-gray-100 text-gray-800 p-4 ${className}`}>
        <div className="mb-6 px-2">
          <div className="text-lg font-semibold">Admin</div>
          <div className="text-xs text-gray-500 mt-1">Dashboard navigation</div>
        </div>
        <nav className="flex-1">
          <ul className="space-y-1">
            {items.map(it => (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  end={it.to === '/admin'}
                  className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium no-underline ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`
                    }
                >
                  <i className={`bi ${it.icon || 'bi-speedometer2'} text-lg text-gray-500`}></i>
                  <span>{it.label}</span>
                  {it.badge && <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">{it.badge}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 px-2 text-xs text-gray-500">Signed in as <span className="font-medium text-gray-700">{(JSON.parse(localStorage.getItem('user')||'null')||{}).username || '—'}</span></div>
      </aside>

      {/* Mobile slide-over */}
      <div className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
        <aside className={`absolute left-0 top-0 bottom-0 w-64 bg-gray-100 text-gray-800 p-4 transform transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold">Admin</div>
              <div className="text-xs text-gray-500 mt-1">Dashboard navigation</div>
            </div>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-200">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <nav className="flex-1">
            <ul className="space-y-1">
              {items.map(it => (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.to === '/admin'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium no-underline ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`
                    }
                  >
                    <i className={`bi ${it.icon || 'bi-speedometer2'} text-lg text-gray-500`}></i>
                    <span>{it.label}</span>
                    {it.badge && <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">{it.badge}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}
