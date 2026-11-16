import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Invoice from '../components/Invoice';
import { useAuth } from '../context/AuthContext';

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invoiceSale, setInvoiceSale] = useState(null);
  const invoiceRef = useRef();

  useEffect(() => {
    api.get('/products', { params: { all: 'true' } }).then(({ data }) => setProducts(data.data)).catch(()=>toast.error('Failed to load products')).finally(()=>setLoading(false));
  }, []);

  const matches = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return products.slice(0, 20);
    return products.filter(p => p.name.toLowerCase().includes(s) || (p.barcode||'').toLowerCase().includes(s)).slice(0, 20);
  }, [products, search]);

  const addToCart = (p) => {
    if (p.stock <= 0) return toast.error('Out of stock');
    setCart((prev) => {
      const idx = prev.findIndex(i => i.productId === p._id);
      if (idx >= 0) {
        const next = [...prev];
        if (next[idx].quantity + 1 > p.stock) { toast.error('Insufficient stock'); return prev; }
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { productId: p._id, name: p.name, unit: p.unit, sellingPrice: p.sellingPrice, stock: p.stock, quantity: 1 }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) => prev.map(i => {
      if (i.productId !== productId) return i;
      const q = i.quantity + delta;
      if (q < 1) return i;
      if (q > i.stock) { toast.error('Insufficient stock'); return i; }
      return { ...i, quantity: q };
    }));
  };

  const removeItem = (productId) => setCart((prev) => prev.filter(i => i.productId !== productId));

  const subtotal = cart.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
  const grandTotal = Math.max(0, subtotal - Number(discount || 0));

  const generateBill = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (Number(discount || 0) > subtotal) return toast.error('Discount cannot exceed subtotal');
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        discount: Number(discount || 0),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      const { data } = await api.post('/sales', payload);
      toast.success('Bill generated');
      setInvoiceSale(data.data);
      setCart([]); setDiscount(0); setCustomerName(''); setCustomerPhone('');
      // refresh products stock
      const refreshed = await api.get('/products', { params: { all: 'true' } });
      setProducts(refreshed.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setSubmitting(false);
    }
  };

  const printInvoice = () => {
    if (!invoiceRef.current) return;
    const content = invoiceRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`<html><head><title>Invoice</title><style>body{font-family:monospace;margin:0;padding:8px;} table{width:100%;border-collapse:collapse;} .text-right{text-align:right;} .text-left{text-align:left;} .text-center{text-align:center;} hr{border:none;border-top:1px dashed #000;margin:6px 0;} @page{size:80mm auto;margin:4mm;} @media print{body{width:72mm;}}</style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  const downloadInvoice = () => {
    // Use print dialog as PDF download (Save as PDF) for broad compatibility
    printInvoice();
    toast('Use "Save as PDF" in print dialog to download.', { icon: 'ℹ️' });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">POS / New Bill</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Products</h3>
          <input className="w-full border rounded-md px-3 py-2" placeholder="Search by name or barcode..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          <div className="max-h-[420px] overflow-auto divide-y">
            {loading ? <div className="p-3 text-sm">Loading...</div> : matches.length === 0 ? <div className="p-3 text-sm text-gray-500">No products found.</div> : matches.map(p => (
              <button key={p._id} onClick={()=>addToCart(p)} className="w-full text-left p-3 hover:bg-gray-50 flex justify-between items-center">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.category} · {p.unit} · Stock: {p.stock}</div>
                </div>
                <div className="text-emerald-700 font-semibold">₹{Number(p.sellingPrice).toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Cart</h3>
          {cart.length === 0 ? <div className="text-sm text-gray-500">Click products to add to cart.</div> : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {cart.map(item => (
                <div key={item.productId} className="border rounded-md p-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">₹{item.sellingPrice} / {item.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>updateQty(item.productId,-1)} className="px-2 border rounded">-</button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button onClick={()=>updateQty(item.productId,1)} className="px-2 border rounded">+</button>
                  </div>
                  <div className="w-20 text-right font-medium">₹{(item.sellingPrice*item.quantity).toFixed(2)}</div>
                  <button onClick={()=>removeItem(item.productId)} className="text-red-600 text-sm">Remove</button>
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between items-center gap-2"><span>Discount</span><input type="number" min="0" step="0.01" className="border rounded px-2 py-1 w-32 text-right" value={discount} onChange={(e)=>setDiscount(e.target.value)} /></div>
            <div className="flex justify-between font-semibold text-lg"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Customer Name (optional)" className="border rounded-md px-3 py-2" value={customerName} onChange={(e)=>setCustomerName(e.target.value)} />
            <input placeholder="Customer Phone (optional)" className="border rounded-md px-3 py-2" value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)} />
          </div>
          <button disabled={submitting || cart.length===0} onClick={generateBill} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-medium disabled:opacity-50">
            {submitting ? 'Generating...' : 'Generate Bill'}
          </button>
        </div>
      </div>

      {invoiceSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-2 no-print">
              <h3 className="font-semibold">Invoice Generated</h3>
              <button onClick={()=>setInvoiceSale(null)} className="text-gray-500">Close</button>
            </div>
            <Invoice ref={invoiceRef} sale={invoiceSale} user={user} />
            <div className="flex gap-2 mt-4 no-print">
              <button onClick={printInvoice} className="flex-1 bg-emerald-600 text-white py-2 rounded-md">Print Bill</button>
              <button onClick={downloadInvoice} className="flex-1 border border-emerald-600 text-emerald-700 py-2 rounded-md">Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
