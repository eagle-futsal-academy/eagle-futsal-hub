import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Standings from './pages/Standings'
import Players from './pages/Players'
import Report from './pages/Report'
import Students from './pages/academy/Students'
import Attendance from './pages/academy/Attendance'
import Billing from './pages/academy/Billing'
import InvoicePrint from './pages/academy/InvoicePrint'
import Performance from './pages/academy/Performance'
import Finance from './pages/Finance'
import Marketing from './pages/Marketing'
import Advisory from './pages/Advisory'
import { useData } from './contexts/DataContext'
import { useEffect } from 'react'

const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-xl font-bold text-slate-700 mb-2">{title}</h2>
      <p className="text-sm text-slate-400">Modul ini sedang dalam pengembangan</p>
    </div>
  </div>
);

export default function App() {
  const { notification } = useData();

  // Listen for session timeout
  useEffect(() => {
    const handler = () => alert('Sesi admin telah berakhir karena tidak aktif.');
    window.addEventListener('session-timeout', handler);
    return () => window.removeEventListener('session-timeout', handler);
  }, []);

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/players" element={<Players />} />
          <Route path="/report" element={<Report />} />
          <Route path="/academy/students" element={<Students />} />
          <Route path="/academy/attendance" element={<Attendance />} />
          <Route path="/academy/billing" element={<Billing />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/advisory" element={<Advisory />} />
          <Route path="/events" element={<ComingSoon title="Manajemen Event" />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="/academy/invoice/print/:id" element={<InvoicePrint />} />
      </Routes>
      {notification && (
        <div className="fixed top-4 right-4 bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold z-[100]">
          {notification}
        </div>
      )}
    </>
  );
}