import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Reports() {
  const [type, setType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [profit, setProfit] = useState(null);
  const [top, setTop] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { type, startDate: type==='custom'?startDate:undefined, endDate: type==='custom'?endDate:undefined };
      const [s, p, t, l] = await Promise.all([
        api.get('/reports/sales', { params }),
        api.get('/reports/profit', { params }),
        api.get('/reports/top-products', { params: { startDate: params.startDate, endDate: params.endDate } }),
        api.get('/inventory/low-stock'),
      ]);
      setSalesData(s.data.data);
      setProfit(p.data.data);
      setTop(t.data.data);
      setLowStock(l.data.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const exportSales = async () => {
    try {
      const res = await api.get('/reports/sales', { params: { type, startDate: type==='custom'?startDate:undefined, endDate: type==='custom'?endDate:undefined, format: 'csv' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href=url; a.download='sales-report.csv'; a.click(); window.URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };
  const exportPurchases = async () => {
    try {
      const res = await api.get('/reports/purchases', { params: { startDate: type==='custom'?startDate:undefined, endDate: type==='custom'?endDate:undefined, format: 'csv' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href=url; a.download='purchases-report.csv'; a.click(); window.URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const fmt = (n) => `₹${Number(n||0).toFixed(2)}`;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Reports</h2>
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-sm mb-1">Period</label>
          <select className="border rounded-md px-3 py-2" value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        {type==='custom' && <>
          <div><label className="block text-sm mb-1">Start</label><input type="date" className="border rounded-md px-3 py-2" value={startDate} onChange={(e)=>setStartDate(e.target.value)} /></div>
          <div><label className="block text-sm mb-1">End</label><input type="date" className="border rounded-md px-3 py-2" value={endDate} onChange={(e)=>setEndDate(e.target.value)} /></div>
        </>}
        <button onClick={load} className="bg-emerald-600 text-white px-4 py-2 rounded-md">{loading ? 'Loading...' : 'Generate'}</button>
        <button onClick={exportSales} className="border px-4 py-2 rounded-md">Export Sales CSV</button>
        <button onClick={exportPurchases} className="border px-4 py-2 rounded-md">Export Purchases CSV</button>
      </div>

      {profit && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4"><div className="text-sm text-gray-500">Total Sales Revenue</div><div className="text-xl font-semibold">{fmt(profit.totalSalesRevenue)}</div></div>
          <div className="bg-white border rounded-lg p-4"><div className="text-sm text-gray-500">Total Bills</div><div className="text-xl font-semibold">{profit.totalBills}</div></div>
          <div className="bg-white border rounded-lg p-4"><div className="text-sm text-gray-500">Stock Purchase Cost</div><div className="text-xl font-semibold">{fmt(profit.totalStockPurchaseCost)}</div></div>
          <div className="bg-white border rounded-lg p-4"><div className="text-sm text-gray-500">Estimated Gross Profit</div><div className="text-xl font-semibold text-emerald-700">{fmt(profit.estimatedGrossProfit)}</div></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Sales Summary</h3>
          {salesData ? (
            <div className="text-sm space-y-1">
              <div>Period: {new Date(salesData.range.start).toLocaleDateString()} - {new Date(salesData.range.end).toLocaleDateString()}</div>
              <div>Total Revenue: <b>{fmt(salesData.totalRevenue)}</b></div>
              <div>Total Bills: <b>{salesData.totalBills}</b></div>
              <div>Total Discount: <b>{fmt(salesData.totalDiscount)}</b></div>
            </div>
          ) : <div className="text-sm text-gray-500">Generate a report to view sales summary.</div>}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Low Stock Products</h3>
          {lowStock.length === 0 ? <div className="text-sm text-gray-500">No low stock products.</div> : (
            <ul className="text-sm space-y-1">{lowStock.map(p => <li key={p._id} className="flex justify-between"><span>{p.name}</span><span className="text-red-600">{p.stock}/{p.minimumStock} {p.unit}</span></li>)}</ul>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Best-Selling Products</h3>
        {top.length === 0 ? <div className="text-sm text-gray-500">No data. Generate report to load.</div> : (
          <div className="overflow-auto"><table className="w-full text-sm"><thead className="text-left text-gray-500"><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>Profit</th></tr></thead><tbody>{top.map(p => (<tr key={p._id} className="border-t"><td className="py-2">{p.name}</td><td>{p.quantitySold}</td><td>{fmt(p.revenue)}</td><td className="text-emerald-700">{fmt(p.profit)}</td></tr>))}</tbody></table></div>
        )}
      </div>
    </div>
  );
}
