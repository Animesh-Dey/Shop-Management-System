import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', shopName: '', shopAddress: '', shopPhone: '', email: '', gstNumber: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const u = data.data;
      setForm({ name: u.name||'', shopName: u.shopName||'', shopAddress: u.shopAddress||'', shopPhone: u.shopPhone||'', email: u.email||'', gstNumber: u.gstNumber||'' });
    }).catch(()=>toast.error('Failed to load settings')).finally(()=>setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      await refreshUser();
      toast.success('Settings updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">Shop Settings</h2>
      <form onSubmit={save} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm mb-1">Owner Name</label><input className="w-full border rounded-md px-3 py-2" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} /></div>
          <div><label className="block text-sm mb-1">Shop Name</label><input className="w-full border rounded-md px-3 py-2" value={form.shopName} onChange={(e)=>setForm({...form,shopName:e.target.value})} /></div>
          <div><label className="block text-sm mb-1">Email</label><input type="email" className="w-full border rounded-md px-3 py-2" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} /></div>
          <div><label className="block text-sm mb-1">Phone Number</label><input className="w-full border rounded-md px-3 py-2" value={form.shopPhone} onChange={(e)=>setForm({...form,shopPhone:e.target.value})} /></div>
          <div className="md:col-span-2"><label className="block text-sm mb-1">Shop Address</label><input className="w-full border rounded-md px-3 py-2" value={form.shopAddress} onChange={(e)=>setForm({...form,shopAddress:e.target.value})} /></div>
          <div><label className="block text-sm mb-1">GST Number (optional)</label><input className="w-full border rounded-md px-3 py-2" value={form.gstNumber} onChange={(e)=>setForm({...form,gstNumber:e.target.value})} /></div>
        </div>
        <p className="text-sm text-gray-500">These details are used on generated invoices. (Invoice footer message can be customized in future; default thank-you message is shown.)</p>
        <button disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded-md disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
      </form>
    </div>
  );
}
