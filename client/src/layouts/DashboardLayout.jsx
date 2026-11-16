import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/pos', label: 'POS / New Bill' },
  { to: '/products', label: 'Products' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/purchases', label: 'Stock Purchases' },
  { to: '/sales', label: 'Sales History' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Shop Settings' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-emerald-700">{user?.shopName || 'Grocery Shop'}</h1>
          <p className="text-xs text-gray-500">POS & Inventory</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50">
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="md:hidden font-semibold text-emerald-700">{user?.shopName}</div>
          <div className="hidden md:block text-sm text-gray-600">Welcome, {user?.name}</div>
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={handleLogout} className="text-sm text-red-600">Logout</button>
          </div>
        </header>
        {/* Mobile nav */}
        <div className="md:hidden bg-white border-b border-gray-200 p-2 flex gap-2 overflow-x-auto">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({isActive}) => `whitespace-nowrap px-2 py-1 rounded text-xs ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'}`}>{l.label}</NavLink>
          ))}
        </div>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
