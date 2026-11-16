import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdj, setShowAdj] = useState(false);
  const [adj, setAdj] = useState({ productId: '', quantity: '', reason: '' });
  const [products, setProducts] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, mov, prods] = await Promise.all([
        api.get('/inventory', { params: { search, lowStock: lowOnly ? 'true' : undefined, limit: 100 } }),
        api.get('/inventory/movements', { params: { limit: 20 } }),
        api.get('/products', { params: { all: 'true' } }),
      ]);
      setItems(inv.data.data);
      setMovements(mov.data.data);
      setProducts(prods.data.data);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submitAdj = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjustment', { productId: adj.productId, quantity: Number(adj.quantity), reason: adj.reason });
      toast.success('Stock adjusted');
      setShowAdj(false); setAdj({ productId: '', quantity: '', reason: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Adjustment failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Inventory</h2>
        <button onClick={()=>setShowAdj(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-md">Manual Adjustment</button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input placeholder="Search inventory" className="border rounded-md px-3 py-2" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={lowOnly} onChange={(e)=>setLowOnly(e.target.checked)} /> Low stock only</label>
        <button onClick={load} className="px-3 py-2 border rounded-md">Apply / Refresh</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">Product</th><th>Category</th><th>Stock</th><th>Min</th><th>Unit</th><th>Status</th></tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4" colSpan={6}>Loading...</td></tr> : items.length === 0 ? <tr><td className="p-4" colSpan={6}>No items found.</td></tr> : items.map(p => (
              <tr key={p._id} className="border-t">
                <td className="p-3 font-medium">{p.name}</td><td>{p.category}</td><td>{p.stock}</td><td>{p.minimumStock}</td><td>{p.unit}</td>
                <td>{p.stock <= p.minimumStock ? <span className="text-red-600 font-medium">Low</span> : <span className="text-emerald-700">OK</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Recent Stock Movements</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500"><tr><th className="py-2">Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Prev</th><th>New</th><th>Reason/Ref</th></tr></thead>
            <tbody>
              {movements.length === 0 ? <tr><td className="py-2" colSpan={7}>No movements yet.</td></tr> : movements.map(m => (
                <tr key={m._id} className="border-t">
                  <td className="py-2">{new Date(m.createdAt).toLocaleString()}</td>
                  <td>{m.productId?.name || '-'}</td>
                  <td>{m.movementType}</td>
                  <td className={m.quantity < 0 ? 'text-red-600' : 'text-emerald-700'}>{m.quantity}</td>
                  <td>{m.previousStock}</td>
                  <td>{m.updatedStock}</td>
                  <td>{m.reason || m.referenceId || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdj && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-5">
            <h3 className="text-lg font-semibold mb-4">Stock Adjustment</h3>
            <form onSubmit={submitAdj} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Product</label>
                <select required className="w-full border rounded-md px-3 py-2" value={adj.productId} onChange={(e)=>setAdj({...adj,productId:e.target.value})}>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Quantity Change (+/-)</label>
                <input type="number" step="any" required className="w-full border rounded-md px-3 py-2" value={adj.quantity} onChange={(e)=>setAdj({...adj,quantity:e.target.value})} placeholder="e.g. 5 or -2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Reason</label>
                <input required className="w-full border rounded-md px-3 py-2" value={adj.reason} onChange={(e)=>setAdj({...adj,reason:e.target.value})} placeholder="Damage, correction, etc." />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={()=>setShowAdj(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-md">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
