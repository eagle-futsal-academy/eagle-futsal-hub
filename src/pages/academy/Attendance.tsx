import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Smartphone, 
  Search, 
  CheckCheck 
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  full_name?: string;
  jersey_number?: number;
  age_cohort: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  session_type: string;
}

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<'training' | 'match'>('training');
  const [selectedCohort, setSelectedCohort] = useState<string>('U-12');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate, sessionType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get all active students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, full_name, jersey_number, age_cohort')
        .eq('status', 'active')
        .order('jersey_number', { ascending: true, nullsFirst: false });
        
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // 2. Get attendance for selected date and session_type
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate)
        .eq('session_type', sessionType);
        
      if (attendanceError) throw attendanceError;
      
      const attendanceMap: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
      if (attendanceData) {
        attendanceData.forEach((record: AttendanceRecord) => {
          attendanceMap[record.student_id] = record.status;
        });
      }
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const setStudentStatus = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));

    try {
      // Upsert to Supabase
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('date', selectedDate)
        .eq('session_type', sessionType)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('attendance')
          .insert([{
            student_id: studentId,
            date: selectedDate,
            session_type: sessionType,
            status
          }]);
      }
    } catch (err) {
      console.error('Error updating attendance record:', err);
    }
  };

  // Quick 1-tap: Mark all in cohort as present
  const handleMarkAllPresent = async () => {
    const targetStudents = filteredStudents;
    if (targetStudents.length === 0) return;

    const newMap = { ...attendance };
    targetStudents.forEach(s => {
      newMap[s.id] = 'present';
    });
    setAttendance(newMap);

    try {
      for (const s of targetStudents) {
        const { data: existing } = await supabase
          .from('attendance')
          .select('id')
          .eq('student_id', s.id)
          .eq('date', selectedDate)
          .eq('session_type', sessionType)
          .maybeSingle();

        if (existing) {
          await supabase.from('attendance').update({ status: 'present' }).eq('id', existing.id);
        } else {
          await supabase.from('attendance').insert([{
            student_id: s.id,
            date: selectedDate,
            session_type: sessionType,
            status: 'present'
          }]);
        }
      }
    } catch (err) {
      console.error('Batch attendance error:', err);
    }
  };

  // Filtered students
  const filteredStudents = students.filter(s => {
    const matchesCohort = selectedCohort === 'ALL' || s.age_cohort === selectedCohort;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.full_name && s.full_name.toLowerCase().includes(search.toLowerCase())) ||
                          (s.jersey_number && s.jersey_number.toString().includes(search));
    return matchesCohort && matchesSearch;
  });

  // Calculate stats
  const totalInView = filteredStudents.length;
  const presentCount = filteredStudents.filter(s => attendance[s.id] === 'present').length;
  const lateCount = filteredStudents.filter(s => attendance[s.id] === 'late').length;
  const excusedCount = filteredStudents.filter(s => attendance[s.id] === 'excused').length;
  const absentCount = filteredStudents.filter(s => attendance[s.id] === 'absent').length;
  const attendedRate = totalInView > 0 ? Math.round(((presentCount + lateCount) / totalInView) * 100) : 0;

  return (
    <div className="p-3 sm:p-6 w-full max-w-5xl mx-auto space-y-4">
      {/* Mobile-First Header */}
      <div className="bg-gradient-to-r from-green-950 via-slate-900 to-emerald-950 rounded-2xl p-4 sm:p-6 text-white shadow-md border border-green-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-400 text-green-950 rounded-xl">
              <Smartphone size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Papan Absensi Siswa</h1>
              <p className="text-xs text-green-200">Presensi cepat sesi latihan & tanding di lapangan</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="bg-yellow-400 hover:bg-yellow-300 text-green-950 font-extrabold px-3.5 py-2 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5"
            >
              <CheckCheck size={16} /> Tandai Semua Hadir
            </button>
          </div>
        </div>

        {/* Date, Session Type & Cohort Pills */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Calendar size={14} className="text-yellow-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none text-xs font-semibold cursor-pointer"
              />
            </div>

            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10 text-xs font-semibold">
              <button
                onClick={() => setSessionType('training')}
                className={`px-2.5 py-1 rounded-lg transition ${sessionType === 'training' ? 'bg-yellow-400 text-green-950' : 'text-white'}`}
              >
                Latihan
              </button>
              <button
                onClick={() => setSessionType('match')}
                className={`px-2.5 py-1 rounded-lg transition ${sessionType === 'match' ? 'bg-yellow-400 text-green-950' : 'text-white'}`}
              >
                Tanding
              </button>
            </div>
          </div>

          {/* Cohort Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {['U-12', 'U-8', 'U-15', 'U-5', 'ALL'].map(c => (
              <button
                key={c}
                onClick={() => setSelectedCohort(c)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                  selectedCohort === c
                    ? 'bg-yellow-400 text-green-950 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {c === 'ALL' ? 'Semua' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Attendance Counter Bar */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-green-200">Kehadiran:</span>
            <strong className="text-yellow-400 font-extrabold text-sm">
              {presentCount + lateCount} / {totalInView} Siswa ({attendedRate}%)
            </strong>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-400 font-bold">🟢 {presentCount} Hadir</span>
            <span className="text-amber-300 font-bold">🟡 {lateCount} Terlambat</span>
            <span className="text-blue-300 font-bold">🔵 {excusedCount} Izin</span>
            <span className="text-rose-400 font-bold">🔴 {absentCount} Alpa</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Cari siswa atau no punggung..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* STUDENT CARDS (LARGE TOUCH TARGETS FOR SMARTPHONE COACHES) */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm font-medium">Memuat absensi siswa...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm">
          Tidak ada siswa ditemukan di kelas {selectedCohort}.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredStudents.map(student => {
            const currentStatus = attendance[student.id];

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-green-900 text-yellow-400 font-black flex flex-col items-center justify-center shrink-0 border border-green-800">
                    <span className="text-[8px] uppercase tracking-wider text-green-200 leading-none">NO</span>
                    <span className="text-base font-extrabold leading-none mt-0.5">
                      {student.jersey_number || '-'}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-gray-900 text-base leading-tight">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                      {student.full_name}
                    </div>
                  </div>
                </div>

                {/* 4 Big Thumb Buttons for Status (44px min height) */}
                <div className="grid grid-cols-4 gap-1.5 sm:w-80">
                  {/* Hadir */}
                  <button
                    onClick={() => setStudentStatus(student.id, 'present')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                      currentStatus === 'present'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm scale-105'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 size={14} /> Hadir
                  </button>

                  {/* Terlambat */}
                  <button
                    onClick={() => setStudentStatus(student.id, 'late')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                      currentStatus === 'late'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm scale-105'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Clock size={14} /> Telat
                  </button>

                  {/* Izin/Sakit */}
                  <button
                    onClick={() => setStudentStatus(student.id, 'excused')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                      currentStatus === 'excused'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm scale-105'
                        : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Sparkles size={14} /> Izin
                  </button>

                  {/* Alpa */}
                  <button
                    onClick={() => setStudentStatus(student.id, 'absent')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                      currentStatus === 'absent'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm scale-105'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    Alpa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
