
import React, { useState } from 'react';

const REPORT_TYPES = [
  { value: 'inventory', label: 'Inventory Report' },
  { value: 'maintenance', label: 'Maintenance Report' }
];
const TIME_RANGES = [
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' }
];

function getDateRange(range) {
  const now = new Date();
  let start;
  if (range === 'week') {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
  } else {
    start = new Date(now);
    start.setMonth(now.getMonth() - 1);
  }
  return { start, end: now };
}

const Reports = () => {
  const [reportType, setReportType] = useState('inventory');
  const [timeRange, setTimeRange] = useState('week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    let url = reportType === 'inventory' ? '/api/inventory' : '/api/maintenance';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch report');
      let items = await res.json();
      // Filter by date
      const { start, end } = getDateRange(timeRange);
      if (reportType === 'inventory') {
        items = items.filter(item => {
          if (!item.received_date) return false;
          const d = new Date(item.received_date);
          return d >= start && d <= end;
        });
      } else {
        items = items.filter(item => {
          if (!item.date) return false;
          const d = new Date(item.date);
          return d >= start && d <= end;
        });
      }
      setData(items);
    } catch (err) {
      setError(err.message);
      setData([]);
    }
    setLoading(false);
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">Reports</h2>
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Report Type</label>
              <select className="form-select" value={reportType} onChange={e => setReportType(e.target.value)}>
                {REPORT_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Time Range</label>
              <select className="form-select" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                {TIME_RANGES.map(tr => <option key={tr.value} value={tr.value}>{tr.label}</option>)}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={fetchReport} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {data.length > 0 && (
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    {reportType === 'inventory' ? (
                      <>
                        <th>Item Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Received Date</th>
                        <th>Received By</th>
                        <th>Notes</th>
                        <th>Destination</th>
                      </>
                    ) : (
                      <>
                        <th>Date</th>
                        <th>Equipment</th>
                        <th>Tag Number</th>
                        <th>Department</th>
                        <th>Model</th>
                        <th>User</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => reportType === 'inventory' ? (
                    <tr key={idx}>
                      <td>{item.item_name}</td>
                      <td>{item.item_type}</td>
                      <td>{item.status}</td>
                      <td>{item.received_date}</td>
                      <td>{item.received_by}</td>
                      <td>{item.notes}</td>
                      <td>{item.destination}</td>
                    </tr>
                  ) : (
                    <tr key={idx}>
                      <td>{item.date}</td>
                      <td>{item.equipment}</td>
                      <td>{item.tagnumber}</td>
                      <td>{item.department}</td>
                      <td>{item.equipment_model}</td>
                      <td>{item.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(!loading && data.length === 0 && !error) && (
            <div className="alert alert-info">No records found for selected range.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
