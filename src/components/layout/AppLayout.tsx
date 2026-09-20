import { useState } from 'react';
import type { FormEvent } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Trophy, Users, FileText, 
  UserPlus, ClipboardCheck, CreditCard, Activity, 
  DollarSign, Target, CalendarRange, Megaphone,
  Menu, X, LogIn, LogOut, Award, UserCheck, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useData } from '../../contexts/DataContext';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  disabled?: boolean;
  roles?: UserRole[];
}

interface NavGroup {
  group: string;
  roles?: UserRole[];
  items: NavItem[];
}

const NAV_ITEMS: NavGroup[] = [
  {
    group: 'Menu Pelatih (Mobile)',
    roles: ['admin', 'coach'],
    items: [
      { label: 'Papan Nilai Pemain', path: '/coach/scoring', icon: Award, roles: ['admin', 'coach'] },
      { label: 'Papan Absensi Siswa', path: '/academy/attendance', icon: ClipboardCheck, roles: ['admin', 'coach', 'staff'] },
      { label: 'Presensi Pelatih', path: '/coach/attendance', icon: UserCheck, roles: ['admin', 'coach'] },
    ]
  },
  {
    group: 'Kompetisi',
    roles: ['admin', 'coach', 'staff', 'parent', 'public'],
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Jadwal', path: '/schedule', icon: Calendar },
      { label: 'Klasemen/Bagan', path: '/standings', icon: Trophy },
      { label: 'Pemain', path: '/players', icon: Users },
      { label: 'Laporan', path: '/report', icon: FileText, roles: ['admin', 'coach', 'staff'] },
    ]
  },
  {
    group: 'Akademi',
    roles: ['admin', 'coach', 'staff', 'parent'],
    items: [
      { label: 'Siswa', path: '/academy/students', icon: UserPlus, roles: ['admin', 'coach', 'staff', 'parent'] },
      { label: 'Presensi Harian', path: '/academy/attendance', icon: ClipboardCheck, roles: ['admin', 'coach', 'staff'] },
      { label: 'SPP & Tagihan', path: '/academy/billing', icon: CreditCard, roles: ['admin', 'staff'] },
    ]
  },
  {
    group: 'Analitik & Operasional',
    roles: ['admin', 'coach', 'staff', 'public'],
    items: [
      { label: 'Performa Atlet', path: '/performance', icon: Activity, roles: ['admin', 'coach', 'parent'] },
      { label: 'Keuangan & Kas', path: '/finance', icon: DollarSign, roles: ['admin', 'staff'] },
      { label: 'Advisory C-Level', path: '/advisory', icon: Target, roles: ['admin'] },
      { label: 'Manajemen Event', path: '/events', icon: CalendarRange, roles: ['admin', 'staff', 'coach'] },
      { label: 'Marketing & Registrasi', path: '/marketing', icon: Megaphone, roles: ['admin', 'staff', 'coach', 'parent', 'public'] },
    ]
  }
];

export default function AppLayout() {
  const { isAdmin, role, setRole, signIn, signOut } = useAuth();
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

  // Filter NAV_ITEMS by active role
  const filteredNavGroups = NAV_ITEMS.map(group => {
    // If group has role restrictions, check if current role is included
    if (group.roles && !group.roles.includes(role)) {
      return null;
    }
    // Filter items inside group
    const visibleItems = group.items.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(role);
    });

    if (visibleItems.length === 0) return null;
    return { ...group, items: visibleItems };
  }).filter(Boolean) as NavGroup[];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden w-full">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-950 text-white transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col shadow-2xl border-r border-green-900`}>
        {/* Logo and Academy Title */}
        <div className="flex items-center justify-between p-4 border-b border-green-900 bg-green-950">
          <div className="flex items-center space-x-3">
            <img src="/eagle logo.jpeg" alt="Eagle Logo" className="w-10 h-10 rounded-full object-cover border border-yellow-400/40 shadow-sm" />
            <div>
              <h1 className="text-xl font-black text-yellow-400 tracking-tight">EagleHub</h1>
              <p className="text-[11px] text-green-300 font-medium">Eagle Futsal Academy</p>
            </div>
          </div>
          <button className="md:hidden text-green-300 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>

        {/* Role Status Pill in Sidebar */}
        <div className="px-4 py-3 bg-green-900/60 border-b border-green-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-green-200">
            <Shield size={14} className="text-yellow-400" />
            <span>Peran Anda:</span>
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-green-950 text-yellow-300 font-bold border border-green-700 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-yellow-400 focus:outline-none cursor-pointer"
          >
            <option value="admin">👑 Admin</option>
            <option value="coach">⚽ Pelatih</option>
            <option value="staff">📋 Staf</option>
            <option value="parent">👨‍👩‍👦 Ortu</option>
            <option value="public">🌐 Publik</option>
          </select>
        </div>

        {/* Navigation List */}
        <div className="overflow-y-auto flex-1 pb-20 scrollbar-thin">
          {filteredNavGroups.map((group, idx) => (
            <div key={idx} className="px-3 py-3">
              <h3 className="text-[10px] font-extrabold text-green-400/80 uppercase tracking-wider mb-1.5 px-3">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  
                  return (
                    <Link
                      key={itemIdx}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                        isActive 
                          ? 'bg-yellow-400 text-green-950 shadow-md font-bold' 
                          : 'text-green-200 hover:bg-green-900 hover:text-white'
                      }`}
                    >
                      <Icon size={17} className={`mr-2.5 ${isActive ? 'text-green-950' : 'text-yellow-400/80'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <button className="md:hidden text-gray-600 hover:text-gray-900 p-1.5 rounded-lg border border-gray-200" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            
            {/* Competition Selector */}
            <select 
              className="border border-gray-300 rounded-xl shadow-sm focus:border-green-600 focus:ring-green-600 text-xs sm:text-sm py-1.5 px-3 bg-white font-medium max-w-[180px] sm:max-w-none"
              value={activeCompetitionId || ''}
              onChange={(e) => setActiveCompetitionId(e.target.value)}
            >
              <option value="">-- Pilih Kompetisi --</option>
              {competitions?.map((comp: any) => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick RBAC Role Switcher */}
            <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-xl border border-gray-200 text-xs">
              <span className="text-gray-500 font-medium">Peran:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent text-gray-900 font-bold focus:outline-none cursor-pointer"
              >
                <option value="admin">👑 Admin</option>
                <option value="coach">⚽ Pelatih (Coach)</option>
                <option value="staff">📋 Staf Akademi</option>
                <option value="parent">👨‍👩‍👦 Orang Tua</option>
                <option value="public">🌐 Pengunjung Publik</option>
              </select>
            </div>

            {isAdmin ? (
              <button onClick={handleLogout} className="flex items-center text-xs sm:text-sm font-semibold text-gray-600 hover:text-rose-600 px-3 py-1.5 rounded-xl border border-gray-200 transition">
                <LogOut size={15} className="mr-1" />
                <span>Logout</span>
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="flex items-center text-xs sm:text-sm font-semibold bg-green-900 text-white px-3 py-1.5 rounded-xl hover:bg-green-800 transition shadow-sm">
                <LogIn size={15} className="mr-1" />
                <span>Login Admin</span>
              </button>
            )}
          </div>
        </header>

        {/* MOBILE COACH QUICK-ACCESS BAR (Always visible for Coach & Admin on small screens) */}
        {(role === 'coach' || role === 'admin') && (
          <div className="bg-green-900 text-white px-3 py-2 sm:hidden flex items-center justify-around text-xs font-bold border-b border-green-800 shadow-inner">
            <Link
              to="/coach/scoring"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                location.pathname === '/coach/scoring' ? 'bg-yellow-400 text-green-950' : 'text-green-200'
              }`}
            >
              <Award size={14} /> Nilai Pemain
            </Link>
            <Link
              to="/academy/attendance"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                location.pathname === '/academy/attendance' ? 'bg-yellow-400 text-green-950' : 'text-green-200'
              }`}
            >
              <ClipboardCheck size={14} /> Absen Siswa
            </Link>
            <Link
              to="/coach/attendance"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                location.pathname === '/coach/attendance' ? 'bg-yellow-400 text-green-950' : 'text-green-200'
              }`}
            >
              <UserCheck size={14} /> Absen Coach
            </Link>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-gray-900">Login Manajemen EagleHub</h2>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-green-600 focus:ring-green-600 focus:outline-none" 
                  placeholder="admin@eaglefutsal.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-green-600 focus:ring-green-600 focus:outline-none" 
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-green-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-800 transition shadow-md text-sm"
              >
                Masuk ke Sistem
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
