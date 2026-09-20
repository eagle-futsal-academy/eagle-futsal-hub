import { useState } from 'react';
import type { FormEvent } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Trophy, Users, FileText, 
  UserPlus, ClipboardCheck, CreditCard, Activity, 
  DollarSign, Target, CalendarRange, Megaphone,
  Menu, X, LogIn, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useData } from '../../contexts/DataContext';

import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_ITEMS: NavGroup[] = [
  {
    group: 'Kompetisi',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Jadwal', path: '/schedule', icon: Calendar },
      { label: 'Klasemen/Bagan', path: '/standings', icon: Trophy },
      { label: 'Pemain', path: '/players', icon: Users },
      { label: 'Laporan', path: '/report', icon: FileText },
    ]
  },
  {
    group: 'Akademi',
    items: [
      { label: 'Siswa', path: '/academy/students', icon: UserPlus },
      { label: 'Absensi', path: '/academy/attendance', icon: ClipboardCheck },
      { label: 'SPP & Tagihan', path: '/academy/billing', icon: CreditCard },
    ]
  },
  {
    group: 'Analitik',
    items: [
      { label: 'Performa Atlet', path: '/performance', icon: Activity },
      { label: 'Keuangan', path: '/finance', icon: DollarSign, disabled: true },
      { label: 'Advisory C-Level', path: '/advisory', icon: Target, disabled: true },
      { label: 'Manajemen Event', path: '/events', icon: CalendarRange, disabled: true },
      { label: 'Marketing', path: '/marketing', icon: Megaphone, disabled: true },
    ]
  }
];

export default function AppLayout() {
  const { isAdmin, signIn, signOut } = useAuth();
  const { competitions, activeCompetitionId, setActiveCompetitionId } = useData();
  const location = useLocation();
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      setShowLoginModal(false);
    } catch (error) {
      console.error('Login error', error);
      alert('Login failed');
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-900 text-white transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="flex items-center justify-between p-4 border-b border-green-800">
          <div className="flex items-center space-x-3">
            <img src="/eagle logo.jpeg" alt="Eagle Logo" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h1 className="text-xl font-bold text-yellow-500">EagleHub</h1>
              <p className="text-xs text-green-200">Eagle Futsal Academy</p>
            </div>
          </div>
          <button className="md:hidden text-green-200 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {NAV_ITEMS.map((group, idx) => (
            <div key={idx} className="px-4 py-4">
              <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">{group.group}</h3>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  
                  if (item.disabled) {
                    return (
                      <div key={itemIdx} className="flex items-center px-2 py-2 text-sm text-green-700 cursor-not-allowed">
                        <Icon size={18} className="mr-3" />
                        {item.label} (Soon)
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={itemIdx}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-2 py-2 text-sm rounded-md transition-colors ${
                        isActive ? 'bg-green-800 text-white' : 'text-green-200 hover:bg-green-800 hover:text-white'
                      }`}
                    >
                      <Icon size={18} className="mr-3" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm z-40 border-b border-gray-200 h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="hidden sm:block text-xl font-bold text-gray-800 mr-4">
              EagleHub
            </div>
            
            {/* Competition Selector */}
            <select 
              className="border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-1.5"
              value={activeCompetitionId || ''}
              onChange={(e) => setActiveCompetitionId(e.target.value)}
            >
              <option value="">-- Pilih Kompetisi --</option>
              {competitions?.map((comp: any) => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin && <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded font-semibold">Admin</span>}
            {isAdmin ? (
              <button onClick={handleLogout} className="flex items-center text-sm text-gray-600 hover:text-red-600">
                <LogOut size={16} className="mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="flex items-center text-sm text-gray-600 hover:text-green-600">
                <LogIn size={16} className="mr-1" />
                <span className="hidden sm:inline">Login Admin</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Login Admin</h2>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
              </div>
              <button type="submit" className="w-full bg-green-900 text-white py-2 px-4 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
