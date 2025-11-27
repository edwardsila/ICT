import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackToDashboard({ className = '' }) {
  const navigate = useNavigate();
  return (
    <div className={`mb-4 ${className}`}>
      <button
        onClick={() => navigate('/admin')}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-sm font-medium rounded-md hover:bg-gray-50"
      >
        <i className="bi bi-arrow-left"></i>
        Back to dashboard
      </button>
    </div>
  );
}
