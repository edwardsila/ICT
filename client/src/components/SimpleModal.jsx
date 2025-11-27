import React from 'react';

export default function SimpleModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8">
      <div className="fixed inset-0 bg-black/40" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full z-10 overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
