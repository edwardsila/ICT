import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Inventory = () => {
  const [selectedDept, setSelectedDept] = useState('');
  const [form, setForm] = useState({
    asset_no: '',
    asset_type: '',
    serial_no: '',
    manufacturer: '',
    model: '',
    version: '',
    status: 'Active'
  });
  const [message, setMessage] = useState('');
  const [addedItems, setAddedItems] = useState({}); // { dept: [items] }
  const [reportDept, setReportDept] = useState('all');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const DEPARTMENTS = [
    'ICT', 'Finance', 'HR', 'Procurement', 'Transport', 'Security', 'Registry', 'General'
  ];

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    // Add department to form data
    const item = { ...form, department: selectedDept };
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        setMessage('Item added successfully!');
        setForm({ asset_no: '', asset_type: '', serial_no: '', manufacturer: '', model: '', version: '', status: 'Active' });
        // Add item to local state for current department
        setAddedItems(prev => {
          const deptItems = prev[selectedDept] || [];
          return { ...prev, [selectedDept]: [...deptItems, item] };
        });
      } else {
        const errorData = await res.json();
        setMessage(errorData.error ? `Failed to add item: ${errorData.error}` : 'Failed to add item.');
      }
    } catch (err) {
      setMessage('Error connecting to server.');
    }
  };

  const handleReportFetch = async () => {
    setReportLoading(true);
    setReportError('');
    let url = '/api/reports/inventory';
    if (reportDept && reportDept !== 'all') {
      url += `?department=${encodeURIComponent(reportDept)}`;
    }
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        setReportError('Failed to fetch report.');
      }
    } catch (err) {
      setReportError('Error connecting to server.');
    }
    setReportLoading(false);
  };

  return (
    <div className="container py-5">
      <div className="mb-3">
        <Link to="/" className="btn btn-outline-secondary"><i className="bi bi-arrow-left"></i> Back to Home</Link>
      </div>
      <h2 className="mb-4">Inventory</h2>
      <div className="mb-4">
        <h5>Select Department</h5>
        <div className="d-flex flex-wrap gap-2">
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              className={`btn btn-${selectedDept === dept ? 'primary' : 'outline-primary'}`}
              onClick={() => setSelectedDept(dept)}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>
      {selectedDept ? (
        <>
          <div className="card shadow mb-4">
            <div className="card-body">
              <h4 className="mb-3">Add Inventory Item to <span className="text-primary">{selectedDept}</span></h4>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Asset No</label>
                    <input type="text" className="form-control" name="asset_no" value={form.asset_no} onChange={handleChange} placeholder="e.g. 12345" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Asset Type</label>
                    <input type="text" className="form-control" name="asset_type" value={form.asset_type} onChange={handleChange} placeholder="e.g. Laptop, Printer" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Serial No</label>
                    <input type="text" className="form-control" name="serial_no" value={form.serial_no} onChange={handleChange} placeholder="e.g. SN123456" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Manufacturer</label>
                    <input type="text" className="form-control" name="manufacturer" value={form.manufacturer} onChange={handleChange} placeholder="e.g. Dell" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Model</label>
                    <input type="text" className="form-control" name="model" value={form.model} onChange={handleChange} placeholder="e.g. Latitude 5400" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Version</label>
                    <input type="text" className="form-control" name="version" value={form.version} onChange={handleChange} placeholder="e.g. 2023" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={form.status} onChange={handleChange} required>
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Repair</option>
                      <option>Disposed</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary mt-3 w-100">Add Item</button>
              </form>
              {message && <div className="alert alert-info mt-3">{message}</div>}
            </div>
          </div>
          <div className="card shadow">
            <div className="card-body">
              <h5>Recently Added Items for <b>{selectedDept}</b></h5>
              {(addedItems[selectedDept] && addedItems[selectedDept].length > 0) ? (
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>Asset No</th>
                      <th>Asset Type</th>
                      <th>Serial No</th>
                      <th>Manufacturer</th>
                      <th>Model</th>
                      <th>Version</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedItems[selectedDept].map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.asset_no}</td>
                        <td>{item.asset_type}</td>
                        <td>{item.serial_no}</td>
                        <td>{item.manufacturer}</td>
                        <td>{item.model}</td>
                        <td>{item.version}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-muted">No items added yet for this department.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-warning">Please select a department to view or add inventory.</div>
      )}
      <div className="my-4">
        <h4>Generate Inventory Report</h4>
        <div className="d-flex align-items-center mb-2">
          <label className="me-2">Department:</label>
          <select value={reportDept} onChange={e => setReportDept(e.target.value)} className="form-select w-auto">
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button className="btn btn-primary ms-3" onClick={handleReportFetch} disabled={reportLoading}>
            {reportLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
        {reportError && <div className="alert alert-danger">{reportError}</div>}
        {reportData.length > 0 && (
          <div className="card mt-3">
            <div className="card-body">
              <h5>Inventory Report ({reportDept === 'all' ? 'All Departments' : reportDept})</h5>
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Asset No</th>
                    <th>Asset Type</th>
                    <th>Serial No</th>
                    <th>Manufacturer</th>
                    <th>Model</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.asset_no}</td>
                      <td>{item.asset_type}</td>
                      <td>{item.serial_no}</td>
                      <td>{item.manufacturer}</td>
                      <td>{item.model}</td>
                      <td>{item.version}</td>
                      <td>{item.status}</td>
                      <td>{item.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
