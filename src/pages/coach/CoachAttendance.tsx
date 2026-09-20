import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  UserCheck, 
  Clock, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface CoachAttendanceRecord {
  id: string;
  coach_name: string;
  date: string;
  session_time: string;
  venue: string;
  age_cohort: string;
  status: 'present' | 'absent' | 'substitute' | 'late';
  duration_minutes: number;
  notes?: string;
  created_at?: string;
}

export default function CoachAttendance() {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState<CoachAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // Form State
  const initialForm = {
    coach_name: 'Coach Dedi',
    date: new Date().toISOString().slice(0, 10),
    session_time: 'Sore (15:30 - 17:30)',
    venue: 'Lapangan Utama Eagle',
    age_cohort: 'U-12' as 'U-5' | 'U-8' | 'U-12' | 'U-15',
    duration_minutes: 90,
    status: 'present' as 'present' | 'absent' | 'substitute' | 'late',
    notes: ''
  };
  const [form, setForm] = useState(initialForm);

  // Coach presets
  const coachPresets = [
    'Coach Dedi',
    'Coach Hendra',
    'Coach Fajar',
    'Coach Dimas',
    'Coach Rendy'
  ];

  useEffect(() => {
    fetchCoachAttendance();
  }, []);

  const fetchCoachAttendance = async () => {
    try {
      setLoading(true);
      // Try fetching from coach_attendance table, or fallback to training_sessions
      const { data, error } = await supabase
        .from('coach_attendance')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        // Table might not exist yet before SQL migration, fallback to training_sessions
        const { data: fallbackData } = await supabase
          .from('training_sessions')
          .select('*')
          .order('date', { ascending: false });

        if (fallbackData) {
          setRecords(fallbackData.map(t => ({
            id: t.id,
            coach_name: t.coach_name || 'Coach Eagle',
            date: t.date,
            session_time: 'Sore (15:30 - 17:30)',
            venue: 'Lapangan Utama Eagle',
            age_cohort: t.age_cohort || 'U-12',
            status: 'present',
            duration_minutes: t.duration_minutes || 90,
            notes: t.notes
          })));
        }
      } else {
        setRecords(data || []);
      }
    } catch (err) {
      console.error('Error fetching coach attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.coach_name || !form.date) return;

    try {
      setSaving(true);
      const payload = {
        coach_name: form.coach_name,
        date: form.date,
        session_time: form.session_time,
        venue: form.venue,
        age_cohort: form.age_cohort,
        duration_minutes: form.duration_minutes,
        status: form.status,
        notes: form.notes
      };

      // Try inserting into coach_attendance
      const { error: attErr } = await supabase.from('coach_attendance').insert([payload]);

      if (attErr) {
        // If table coach_attendance doesn't exist, insert into training_sessions as fallback
        await supabase.from('training_sessions').insert([{
          date: form.date,
          coach_name: form.coach_name,
          age_cohort: form.age_cohort,
          duration_minutes: form.duration_minutes,
          rpe: 8,
          notes: `${form.venue} • ${form.session_time} • ${form.notes}`
        }]);
      }

      setIsCheckInOpen(false);
      setForm(initialForm);
      fetchCoachAttendance();
    } catch (err) {
      console.error('Check-in error:', err);
      alert('Gagal melakukan check-in pelatih.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus riwayat kehadiran ini?')) return;
    try {
      await supabase.from('coach_attendance').delete().eq('id', id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Monthly stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthRecords = records.filter(r => r.date.startsWith(currentMonth));
  const totalSessionsThisMonth = thisMonthRecords.length;
  const totalMinutesThisMonth = thisMonthRecords.reduce((acc, curr) => acc + (curr.duration_minutes || 90), 0);
  const totalHoursThisMonth = (totalMinutesThisMonth / 60).toFixed(1);

  return (
    <div className="p-3 sm:p-6 w-full max-w-5xl mx-auto space-y-4">
      {/* Mobile-Optimized Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-green-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-md border border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-400 text-green-950 rounded-xl">
              <UserCheck size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Presensi Latihan Pelatih</h1>
              <p className="text-xs text-green-200">Check-in jam melatih & rekap honor sesi pelatih</p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="bg-yellow-400 text-green-950 font-bold px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-yellow-300 transition shadow-sm flex items-center gap-1.5"
          >
            <Plus size={16} /> Check-In Sekarang
          </button>
        </div>

        {/* Quick Month Metrics */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[11px] text-green-200 font-medium">Sesi Latihan Bulan Ini</span>
            <div className="text-xl font-black text-yellow-400 mt-0.5">{totalSessionsThisMonth} Sesi</div>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[11px] text-green-200 font-medium">Total Jam Mengajar</span>
            <div className="text-xl font-black text-white mt-0.5">{totalHoursThisMonth} Jam</div>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-green-200 font-medium">Status Kehadiran Tim Coach</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">100% Aktif</div>
          </div>
        </div>
      </div>

      {/* Check-In Modal for Mobile Phone */}
      {isCheckInOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="bg-green-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="text-yellow-400" size={20} />
                <h3 className="font-extrabold text-base">Check-In Sesi Latihan Coach</h3>
              </div>
              <button onClick={() => setIsCheckInOpen(false)} className="text-green-200 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckIn} className="p-5 space-y-4">
              {/* Nama Coach */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Pelatih *
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.coach_name}
                    onChange={(e) => setForm({ ...form, coach_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                  >
                    {coachPresets.map(cp => (
                      <option key={cp} value={cp}>{cp}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Waktu Sesi
                  </label>
                  <select
                    value={form.session_time}
                    onChange={(e) => setForm({ ...form, session_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                  >
                    <option value="Sore (15:30 - 17:30)">Sore (15:30 - 17:30)</option>
                    <option value="Pagi (08:00 - 10:00)">Pagi (08:00 - 10:00)</option>
                    <option value="Malam (19:00 - 21:00)">Malam (19:00 - 21:00)</option>
                  </select>
                </div>
              </div>

              {/* Cohort & Durasi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Kelompok Usia (Cohort)
                  </label>
                  <select
                    value={form.age_cohort}
                    onChange={(e) => setForm({ ...form, age_cohort: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-xl p-2 text-sm font-bold text-yellow-800 bg-yellow-50 border-yellow-200 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="U-12">Cohort U-12</option>
                    <option value="U-8">Cohort U-8</option>
                    <option value="U-15">Cohort U-15</option>
                    <option value="U-5">Cohort U-5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Durasi Latihan
                  </label>
                  <select
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                  >
                    <option value={60}>60 Menit (1 Jam)</option>
                    <option value={90}>90 Menit (1.5 Jam)</option>
                    <option value={120}>120 Menit (2 Jam)</option>
                  </select>
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Lokasi / Lapangan
                </label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              {/* Materi Latihan / Catatan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Materi Latihan Hari Ini
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Drill transisi bertahan ke menyerang & simulasi set-piece"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-green-900 hover:bg-green-800 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <CheckCircle2 size={18} /> {saving ? 'Memproses Check-in...' : 'Simpan Presensi Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance History Cards (Mobile Friendly) */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
          <Clock size={16} className="text-green-800" /> Riwayat Kehadiran Pelatih ({records.length})
        </h3>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Memuat riwayat kehadiran pelatih...</div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm">
            Belum ada data check-in pelatih. Klik tombol "+ Check-In Sekarang" untuk mendata.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {records.map(record => (
              <div key={record.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-semibold">
                      {new Date(record.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      Hadir ({record.duration_minutes} Menit)
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-base">{record.coach_name}</h4>

                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Layers size={13} className="text-yellow-700" />
                      <span>Kelas: <strong className="text-yellow-800">{record.age_cohort}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-gray-400" />
                      <span>{record.session_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-gray-400" />
                      <span className="truncate">{record.venue}</span>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="mt-3 p-2.5 bg-gray-50 rounded-xl text-xs text-gray-700 border border-gray-100">
                      <strong>Materi:</strong> {record.notes}
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-gray-400 hover:text-rose-600 p-1 text-xs flex items-center gap-1"
                      title="Hapus"
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
