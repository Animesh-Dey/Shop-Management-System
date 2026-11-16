import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Invoice from '../components/Invoice';
import { useAuth } from '../context/AuthContext';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState(null);
  const invoiceRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sales', { params: { search, customer, startDate, endDate, limit: 50 } });
      setSales(data.data);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const view = async (id) => {
    try { const { data } = await api.get(`/sales/${id}`); setSelected(data.data); }
    catch { toast.error('Failed to load invoice'); }
  };

  const printInvoice = () => {
    if (!invoiceRef.current) return;
    const content = invoiceRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`<html><head><title>Invoice</title><style>body{font-family:monospace;margin:0;padding:8px;} table{width:100%;border-collapse:collapse;} .text-right{text-align:right;} .text-left{text-align:left;} .text-center{text-align:center;} hr{border:none;border-top:1px dashed #000;margin:6px 0;} @page{size:80mm auto;margin:4mm;}</style></head><body>${content}</body></html>`);
    win.document.close(); win.focus(); setTimeout(()=>{win.print();win.close();},250);
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/reports/sales', { params: { type: startDate && endDate ? 'custom' : 'monthly', startDate: startDate||undefined, endDate: endDate||undefined, format: 'csv' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'sales-export.csv'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Sales History</h2><button onClick={exportCSV} className="border border-emerald-600 text-emerald-700 px-4 py-2 rounded-md">Export CSV</button></div>
      <div className="flex flex-wrap gap-2">
        <input placeholder="Invoice number" className="border rounded-md px-3 py-2" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <input placeholder="Customer name" className="border rounded-md px-3 py-2" value={customer} onChange={(e)=>setCustomer(e.target.value)} />
        <input type="date" className="border rounded-md px-3 py-2" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
        <input type="date" className="border rounded-md px-3 py-2" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
        <button onClick={load} className="px-3 py-2 bg-emerald-600 text-white rounded-md">Filter</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">Invoice</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4" colSpan={6}>Loading...</td></tr> : sales.length===0 ? <tr><td className="p-4" colSpan={6}>No sales found.</td></tr> : sales.map(s => (
              <tr key={s._id} className="border-t">
                <td className="p-3 font-medium">{s.invoiceNumber}</td>
                <td>{new Date(s.saleDate).toLocaleString()}</td>
                <td>{s.customerName || '-'}</td>
                <td>{s.items.length}</td>
                <td>₹{Number(s.grandTotal).toFixed(2)}</td>
                <td className="space-x-2"><button onClick={()=>view(s._id)} className="text-emerald-700">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-2"><h3 className="font-semibold">Invoice Details</h3><button onClick={()=>setSelected(null)}>Close</button></div>
            <Invoice ref={invoiceRef} sale={selected} user={user} />
            <div className="flex gap-2 mt-4"><button onClick={printInvoice} className="flex-1 bg-emerald-600 text-white py-2 rounded-md">Reprint</button><button onClick={printInvoice} className="flex-1 border border-emerald-600 text-emerald-700 py-2 rounded-md">Download PDF</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
