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
import Events from './pages/Events'
import { useData } from './contexts/DataContext'
import { useEffect } from 'react'

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
          <Route path="/events" element={<Events />} />
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