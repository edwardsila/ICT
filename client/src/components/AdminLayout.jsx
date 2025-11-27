import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminOverview from '../pages/admin/Overview';
import AdminUsers from '../pages/admin/UsersAdmin';
import AdminInventory from '../pages/admin/InventoryAdmin';
import AdminMaintenance from '../pages/admin/MaintenanceAdmin';
import AdminTransfers from '../pages/admin/TransfersAdmin';
import AdminReports from '../pages/admin/ReportsAdmin';
import AdminSettings from '../pages/admin/SettingsAdmin';
import BackToDashboard from './BackToDashboard';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1">
        {/* Top bar with hamburger */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button className="md:hidden p-2 rounded-md hover:bg-gray-100" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                  <i className="bi bi-list text-2xl"></i>
                </button>
                <div className="text-lg font-semibold">Admin Dashboard</div>
              </div>
              <div className="hidden md:flex items-center">{/* placeholder for top controls */}</div>
            </div>
          </div>
        </div>

        <main className="p-6 max-w-7xl mx-auto">
          <BackToDashboard />
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="maintenance" element={<AdminMaintenance />} />
            <Route path="transfers" element={<AdminTransfers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
