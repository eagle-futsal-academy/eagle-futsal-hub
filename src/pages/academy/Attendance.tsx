import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  age_cohort: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  session_type: string;
  students?: {
    name: string;
    age_cohort: string;
  };
}

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState('Latihan');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate, sessionType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get all active students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, age_cohort')
        .eq('status', 'active')
        .order('name');
        
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Get attendance for selected date and session_type
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate)
        .eq('session_type', sessionType);
        
      if (attendanceError) throw attendanceError;
      
      const attendanceMap: Record<string, AttendanceRecord> = {};
      if (attendanceData) {
        attendanceData.forEach((record: AttendanceRecord) => {
          attendanceMap[record.student_id] = record;
        });
      }
      setAttendance(attendanceMap);
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    try {
      const record = {
        student_id: studentId,
        date: selectedDate,
        status,
        session_type: sessionType,
      };

      const { error } = await supabase
        .from('attendance')
        .upsert(record, { onConflict: 'student_id,date' });

      if (error) throw error;

      // Update local state
      setAttendance(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], ...record } as AttendanceRecord
      }));
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Gagal menyimpan absensi');
    }
  };

  const stats = {
    present: Object.values(attendance).filter(a => a.status === 'present').length,
    late: Object.values(attendance).filter(a => a.status === 'late').length,
    excused: Object.values(attendance).filter(a => a.status === 'excused').length,
    absent: Object.values(attendance).filter(a => a.status === 'absent').length,
  };
  
  const totalMarked = stats.present + stats.late + stats.excused + stats.absent;
  const attendanceRate = totalMarked > 0 
    ? Math.round(((stats.present + stats.late) / totalMarked) * 100) 
    : 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-green-900">Absensi Kehadiran</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <div className="px-3 text-gray-500 bg-gray-50 border-r border-gray-300">
              <Calendar size={18} />
            </div>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 outline-none"
            />
          </div>
          
          <select 
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Latihan">Latihan</option>
            <option value="Pertandingan">Pertandingan</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm">Hadir / Terlambat</span>
          <span className="text-2xl font-bold text-green-600">{stats.present + stats.late}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm">Izin</span>
          <span className="text-2xl font-bold text-yellow-600">{stats.excused}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm">Tidak Hadir</span>
          <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm">Tingkat Kehadiran</span>
          <span className="text-2xl font-bold text-blue-600">{attendanceRate}%</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">
            Daftar Siswa Aktif - {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <div className="text-sm text-gray-500">
            {totalMarked} / {students.length} tercatat
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data absensi...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Tidak ada siswa aktif ditemukan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-y border-gray-100">
                  <th className="px-6 py-3 font-medium">Nama Siswa</th>
                  <th className="px-6 py-3 font-medium">Cohort</th>
                  <th className="px-6 py-3 font-medium">Status Absensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => {
                  const currentStatus = attendance[student.id]?.status;
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-800 py-1 px-2 rounded text-xs font-medium">
                          {student.age_cohort}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => markAttendance(student.id, 'present')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                              currentStatus === 'present' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <CheckCircle size={16} className={currentStatus === 'present' ? 'text-green-600' : ''} />
                            Hadir
                          </button>
                          
                          <button
                            onClick={() => markAttendance(student.id, 'late')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                              currentStatus === 'late' 
                                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Clock size={16} className={currentStatus === 'late' ? 'text-blue-600' : ''} />
                            Telat
                          </button>
                          
                          <button
                            onClick={() => markAttendance(student.id, 'excused')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                              currentStatus === 'excused' 
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <AlertTriangle size={16} className={currentStatus === 'excused' ? 'text-yellow-600' : ''} />
                            Izin
                          </button>
                          
                          <button
                            onClick={() => markAttendance(student.id, 'absent')}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                              currentStatus === 'absent' 
                                ? 'bg-red-100 text-red-800 border border-red-200' 
                                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <XCircle size={16} className={currentStatus === 'absent' ? 'text-red-600' : ''} />
                            Alpha
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
