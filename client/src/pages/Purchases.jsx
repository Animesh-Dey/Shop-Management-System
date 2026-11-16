import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [view, setView] = useState(null);
  const [form, setForm] = useState({ supplierName: '', additionalNotes: '', items: [{ productId: '', quantity: '', purchasePrice: '' }] });

  const load = async () => {
    setLoading(true);
    try {
      const [p, prods] = await Promise.all([api.get('/purchases', { params: { limit: 50 } }), api.get('/products', { params: { all: 'true' } })]);
      setPurchases(p.data.data);
      setProducts(prods.data.data);
    } catch { toast.error('Failed to load purchases'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setItem = (i, k, v) => {
    const items = [...form.items];
    items[i] = { ...items[i], [k]: v };
    if (k === 'productId') {
      const p = products.find(x => x._id === v);
      if (p) items[i].purchasePrice = p.purchasePrice;
    }
    setForm({ ...form, items });
  };
  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', quantity: '', purchasePrice: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const subtotal = form.items.reduce((s, it) => s + (Number(it.quantity||0) * Number(it.purchasePrice||0)), 0);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        supplierName: form.supplierName,
        additionalNotes: form.additionalNotes,
        items: form.items.map(it => ({ productId: it.productId, quantity: Number(it.quantity), purchasePrice: Number(it.purchasePrice) })),
      };
      await api.post('/purchases', payload);
      toast.success('Purchase recorded');
      setShow(false);
      setForm({ supplierName: '', additionalNotes: '', items: [{ productId: '', quantity: '', purchasePrice: '' }] });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save purchase'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Stock Purchases</h2><button onClick={()=>setShow(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-md">New Purchase</button></div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3">Purchase #</th><th>Date</th><th>Supplier</th><th>Items</th><th>Total</th><th></th></tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4" colSpan={6}>Loading...</td></tr> : purchases.length === 0 ? <tr><td className="p-4" colSpan={6}>No purchases recorded.</td></tr> : purchases.map(p => (
              <tr key={p._id} className="border-t"><td className="p-3 font-medium">{p.purchaseNumber}</td><td>{new Date(p.purchaseDate).toLocaleString()}</td><td>{p.supplierName||'-'}</td><td>{p.items.length}</td><td>₹{Number(p.grandTotal).toFixed(2)}</td><td><button onClick={()=>setView(p)} className="text-emerald-700">View</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-5 max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Record Stock Purchase</h3>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Supplier Name (optional)</label><input className="w-full border rounded-md px-3 py-2" value={form.supplierName} onChange={(e)=>setForm({...form,supplierName:e.target.value})} /></div>
                <div><label className="block text-sm mb-1">Additional Notes</label><input className="w-full border rounded-md px-3 py-2" value={form.additionalNotes} onChange={(e)=>setForm({...form,additionalNotes:e.target.value})} /></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center"><h4 className="font-medium">Items</h4><button type="button" onClick={addItem} className="text-emerald-700 text-sm">+ Add Item</button></div>
                {form.items.map((it,i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 border p-2 rounded-md">
                    <select required className="border rounded px-2 py-1 md:col-span-2" value={it.productId} onChange={(e)=>setItem(i,'productId',e.target.value)}>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <input required type="number" min="0.01" step="any" placeholder="Qty" className="border rounded px-2 py-1" value={it.quantity} onChange={(e)=>setItem(i,'quantity',e.target.value)} />
                    <div className="flex gap-2">
                      <input required type="number" min="0" step="any" placeholder="Price/unit" className="border rounded px-2 py-1 w-full" value={it.purchasePrice} onChange={(e)=>setItem(i,'purchasePrice',e.target.value)} />
                      {form.items.length>1 && <button type="button" onClick={()=>removeItem(i)} className="text-red-600 px-2">×</button>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right font-semibold">Grand Total: ₹{subtotal.toFixed(2)}</div>
              <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShow(false)} className="px-4 py-2 border rounded-md">Cancel</button><button className="px-4 py-2 bg-emerald-600 text-white rounded-md">Save Purchase</button></div>
            </form>
          </div>
        </div>
      )}

      {view && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-5 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-3"><h3 className="font-semibold">Purchase {view.purchaseNumber}</h3><button onClick={()=>setView(null)}>Close</button></div>
            <div className="text-sm text-gray-600 mb-2">Date: {new Date(view.purchaseDate).toLocaleString()} · Supplier: {view.supplierName||'-'}</div>
            <table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>{view.items.map((i,idx)=>(<tr key={idx} className="border-t"><td className="py-1">{i.productName}</td><td>{i.quantity}</td><td>₹{i.purchasePrice}</td><td>₹{i.itemTotal}</td></tr>))}</tbody></table>
            <div className="text-right font-semibold mt-3">Grand Total: ₹{Number(view.grandTotal).toFixed(2)}</div>
            {view.additionalNotes && <div className="text-sm mt-2">Notes: {view.additionalNotes}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
