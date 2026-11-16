import { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [top, setTop] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c, t, l, r] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/sales-chart'),
          api.get('/dashboard/top-products'),
          api.get('/inventory/low-stock'),
          api.get('/sales?limit=5'),
        ]);
        setStats(s.data.data);
        setChart(c.data.data);
        setTop(t.data.data);
        setLowStock(l.data.data);
        setRecent(r.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat label="Today's Sales" value={fmt(stats?.todaySales)} />
        <Stat label="Today's Bills" value={stats?.todayBills ?? 0} />
        <Stat label="Total Products" value={stats?.totalProducts ?? 0} />
        <Stat label="Low Stock" value={stats?.lowStockCount ?? 0} />
        <Stat label="Inventory Value" value={fmt(stats?.inventoryValue)} />
        <Stat label="This Month Sales" value={fmt(stats?.monthSales)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Daily Sales (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Monthly Sales Overview</h3>
          <div className="text-sm text-gray-600 mb-2">Current month total: <span className="font-semibold text-gray-900">{fmt(stats?.monthSales)}</span></div>
          <div className="text-sm text-gray-600">Today's bills: <span className="font-semibold text-gray-900">{stats?.todayBills ?? 0}</span></div>
          <div className="text-sm text-gray-600 mt-2">Inventory value is calculated from current stock and purchase prices.</div>
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Top Selling Products</h4>
            {top.length === 0 ? <div className="text-sm text-gray-500">No sales yet.</div> : (
              <ul className="space-y-1 text-sm">
                {top.map((p) => (
                  <li key={p._id} className="flex justify-between"><span>{p.name}</span><span className="text-gray-600">{p.quantity} sold · {fmt(p.revenue)}</span></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Recent Sales</h3>
          {recent.length === 0 ? <div className="text-sm text-gray-500">No sales yet.</div> : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-2">Invoice</th><th>Date</th><th>Total</th></tr></thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s._id} className="border-t">
                      <td className="py-2">{s.invoiceNumber}</td>
                      <td>{new Date(s.saleDate).toLocaleString()}</td>
                      <td>{fmt(s.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Low Stock Alerts</h3>
          {lowStock.length === 0 ? <div className="text-sm text-gray-500">All stocks are healthy.</div> : (
            <ul className="space-y-2 text-sm">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p._id} className="flex justify-between border-b pb-1">
                  <span>{p.name}</span>
                  <span className="text-red-600 font-medium">{p.stock} {p.unit} (min {p.minimumStock})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
