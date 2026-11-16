import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '', shopAddress: '', shopPhone: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-700 mb-1">Create Shop Account</h1>
        <p className="text-sm text-gray-500 mb-6">Register your grocery shop</p>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Owner Name</label><input required className="w-full border rounded-md px-3 py-2" value={form.name} onChange={(e)=>set('name',e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1">Shop Name</label><input required className="w-full border rounded-md px-3 py-2" value={form.shopName} onChange={(e)=>set('shopName',e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" required className="w-full border rounded-md px-3 py-2" value={form.email} onChange={(e)=>set('email',e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" required minLength={6} className="w-full border rounded-md px-3 py-2" value={form.password} onChange={(e)=>set('password',e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1">Shop Phone</label><input className="w-full border rounded-md px-3 py-2" value={form.shopPhone} onChange={(e)=>set('shopPhone',e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1">Shop Address</label><input className="w-full border rounded-md px-3 py-2" value={form.shopAddress} onChange={(e)=>set('shopAddress',e.target.value)} /></div>
          <div className="md:col-span-2">
            <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-2 font-medium disabled:opacity-50">
              {loading ? 'Creating...' : 'Register'}
            </button>
          </div>
        </form>
        <p className="text-sm text-gray-600 mt-4">Already have an account? <Link to="/login" className="text-emerald-700 font-medium">Login</Link></p>
      </div>
    </div>
  );
}
