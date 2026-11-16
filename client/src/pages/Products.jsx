import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const units = ['Piece','Kg','Gram','Litre','Millilitre','Packet','Dozen','Box'];
const empty = { name:'', barcode:'', sku:'', category:'', purchasePrice:'', sellingPrice:'', stock:'', minimumStock:'', unit:'Piece' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { search, category, all: 'true' } });
      setProducts(data.data);
    } catch (e) { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setShow(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setShow(true); };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, purchasePrice: Number(form.purchasePrice), sellingPrice: Number(form.sellingPrice), stock: Number(form.stock||0), minimumStock: Number(form.minimumStock||0) };
      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product added');
      }
      setShow(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const remove = async (p) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    try { await api.delete(`/products/${p._id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const filtered = products.filter(p => {
    const s = search.toLowerCase();
    return (!s || p.name.toLowerCase().includes(s) || (p.barcode||'').toLowerCase().includes(s)) && (!category || p.category === category);
  });
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Products</h2>
        <button onClick={openNew} className="bg-emerald-600 text-white px-4 py-2 rounded-md">Add Product</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input placeholder="Search name or barcode" className="border rounded-md px-3 py-2" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <select className="border rounded-md px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={load} className="px-3 py-2 border rounded-md">Refresh</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr>
            <th className="p-3">Name</th><th>Barcode</th><th>Category</th><th>Purchase</th><th>Selling</th><th>Stock</th><th>Min</th><th>Unit</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4" colSpan={9}>Loading...</td></tr> : filtered.length === 0 ? <tr><td className="p-4" colSpan={9}>No products found.</td></tr> : filtered.map(p => (
              <tr key={p._id} className="border-t">
                <td className="p-3 font-medium">{p.name}</td>
                <td>{p.barcode || '-'}</td>
                <td>{p.category}</td>
                <td>₹{p.purchasePrice}</td>
                <td>₹{p.sellingPrice}</td>
                <td className={p.stock <= p.minimumStock ? 'text-red-600 font-medium' : ''}>{p.stock}</td>
                <td>{p.minimumStock}</td>
                <td>{p.unit}</td>
                <td className="space-x-2">
                  <button onClick={()=>openEdit(p)} className="text-emerald-700">Edit</button>
                  <button onClick={()=>remove(p)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-5 max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['name','Product Name'],['barcode','Barcode'],['sku','SKU'],['category','Category'],
                ['purchasePrice','Purchase Price','number'],['sellingPrice','Selling Price','number'],
                ['stock','Available Stock','number'],['minimumStock','Minimum Stock Level','number'],
              ].map(([k,label,type='text']) => (
                <div key={k}><label className="block text-sm mb-1">{label}</label><input type={type} step="any" required={['name','category','purchasePrice','sellingPrice'].includes(k)} disabled={editing && k==='stock'} className="w-full border rounded-md px-3 py-2 disabled:bg-gray-100" value={form[k]??''} onChange={(e)=>setForm({...form,[k]:e.target.value})} /></div>
              ))}
              <div>
                <label className="block text-sm mb-1">Unit</label>
                <select className="w-full border rounded-md px-3 py-2" value={form.unit} onChange={(e)=>setForm({...form,unit:e.target.value})}>
                  {units.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" onClick={()=>setShow(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-md">Save</button>
              </div>
              {editing && <p className="md:col-span-2 text-xs text-gray-500">Stock cannot be edited directly here; use Inventory adjustments or purchases/sales.</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
