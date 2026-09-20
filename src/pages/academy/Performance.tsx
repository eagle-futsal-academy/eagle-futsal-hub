import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useData } from '../../contexts/DataContext';
import { 
  Activity, 
  Star, 
  User, 
  Search, 
  Calendar, 
  Award, 
  X, 
  History, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal
} from 'lucide-react';

interface StudentRecord {
  id: string;
  name: string;
  full_name?: string;
  dob?: string;
  age_cohort: string;
  jersey_number?: number;
  photo_url?: string;
  status: 'active' | 'inactive';
}

interface PerformanceEvalRecord {
  id: string;
  student_id: string;
  coach_name?: string;
  date: string;
  passing: number;
  dribbling: number;
  ball_control: number;
  shooting: number;
  tactical: number;
  composite_score?: number;
  notes?: string;
  created_at?: string;
}

interface EvalScores {
  passing: number;
  dribbling: number;
  ball_control: number;
  shooting: number;
  tactical: number;
}

const DEFAULT_SCORES: EvalScores = {
  passing: 7,
  dribbling: 7,
  ball_control: 7,
  shooting: 7,
  tactical: 7,
};

const SKILL_CONFIG = [
  {
    key: 'passing' as const,
    label: 'Passing',
    subLabel: 'Akurasi, visi operan, & bobot bola',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    barColor: 'bg-blue-500',
  },
  {
    key: 'dribbling' as const,
    label: 'Dribbling',
    subLabel: 'Kontrol gerak, kelincahan, & proteksi bola',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    barColor: 'bg-amber-500',
  },
  {
    key: 'ball_control' as const,
    label: 'Ball Control',
    subLabel: 'Sentuhan pertama (first touch) & kontrol ruang sempit',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    barColor: 'bg-emerald-500',
  },
  {
    key: 'shooting' as const,
    label: 'Shooting',
    subLabel: 'Akurasi tembakan, power, & ketenangan finishing',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    barColor: 'bg-rose-500',
  },
  {
    key: 'tactical' as const,
    label: 'Tactical',
    subLabel: 'Posisi bertahan/menyerang, transisi, & pengambilan keputusan',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    barColor: 'bg-purple-500',
  },
];

export default function Performance() {
  const { user } = useAuth();
  const { showNotification } = useData();

  // Data states
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [evaluations, setEvaluations] = useState<PerformanceEvalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [cohortFilter, setCohortFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EVALUATED' | 'PENDING'>('ALL');

  // Evaluation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [coachName, setCoachName] = useState('');
  const [scores, setScores] = useState<EvalScores>(DEFAULT_SCORES);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // History Modal
  const [historyStudent, setHistoryStudent] = useState<StudentRecord | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, full_name, dob, age_cohort, jersey_number, photo_url, status')
        .eq('status', 'active')
        .order('name');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch performance evaluations
      const { data: evalsData, error: evalsError } = await supabase
        .from('performance_evals')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (evalsError) throw evalsError;
      setEvaluations(evalsData || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map latest eval per student
  const evalsByStudent = useMemo(() => {
    const map: Record<string, PerformanceEvalRecord[]> = {};
    evaluations.forEach((item) => {
      if (!map[item.student_id]) {
        map[item.student_id] = [];
      }
      map[item.student_id].push(item);
    });
    return map;
  }, [evaluations]);

  const latestEvalByStudent = useMemo(() => {
    const map: Record<string, PerformanceEvalRecord> = {};
    Object.keys(evalsByStudent).forEach((studentId) => {
      const studentEvals = evalsByStudent[studentId];
      if (studentEvals && studentEvals.length > 0) {
        map[studentId] = studentEvals[0]; // sorted by date & created_at desc
      }
    });
    return map;
  }, [evalsByStudent]);

  // Helper to compute or get composite score
  const getCompositeScore = (evalRecord?: PerformanceEvalRecord): number | null => {
    if (!evalRecord) return null;
    if (typeof evalRecord.composite_score === 'number') {
      return Number(evalRecord.composite_score);
    }
    const sum =
      Number(evalRecord.passing || 0) +
      Number(evalRecord.dribbling || 0) +
      Number(evalRecord.ball_control || 0) +
      Number(evalRecord.shooting || 0) +
      Number(evalRecord.tactical || 0);
    return Number((sum / 5).toFixed(2));
  };

  // Calculated stats for KPI cards
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const evaluatedStudentsCount = Object.keys(latestEvalByStudent).length;
    let totalScore = 0;
    let scoredCount = 0;

    Object.values(latestEvalByStudent).forEach((ev) => {
      const score = getCompositeScore(ev);
      if (score !== null) {
        totalScore += score;
        scoredCount += 1;
      }
    });

    const averageAcademyScore = scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : '-';

    return {
      totalStudents,
      evaluatedStudentsCount,
      pendingCount: totalStudents - evaluatedStudentsCount,
      averageAcademyScore,
    };
  }, [students, latestEvalByStudent]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      const searchMatch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.full_name && s.full_name.toLowerCase().includes(search.toLowerCase()));

      // Cohort
      const cohortMatch = cohortFilter === 'ALL' || s.age_cohort === cohortFilter;

      // Evaluation status
      const hasEval = !!latestEvalByStudent[s.id];
      const statusMatch =
        statusFilter === 'ALL' ||
        (statusFilter === 'EVALUATED' && hasEval) ||
        (statusFilter === 'PENDING' && !hasEval);

      return searchMatch && cohortMatch && statusMatch;
    });
  }, [students, search, cohortFilter, statusFilter, latestEvalByStudent]);

  // Open evaluation modal
  const handleOpenEvalModal = (student: StudentRecord) => {
    setSelectedStudent(student);
    const latest = latestEvalByStudent[student.id];

    if (latest) {
      setScores({
        passing: latest.passing ?? 7,
        dribbling: latest.dribbling ?? 7,
        ball_control: latest.ball_control ?? 7,
        shooting: latest.shooting ?? 7,
        tactical: latest.tactical ?? 7,
      });
      setCoachName(latest.coach_name || user?.email?.split('@')[0] || 'Coach Eagle');
    } else {
      setScores(DEFAULT_SCORES);
      setCoachName(user?.email?.split('@')[0] || 'Coach Eagle');
    }

    setEvalDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  // Live composite score in modal
  const liveComposite = useMemo(() => {
    const sum =
      Number(scores.passing) +
      Number(scores.dribbling) +
      Number(scores.ball_control) +
      Number(scores.shooting) +
      Number(scores.tactical);
    return (sum / 5).toFixed(1);
  }, [scores]);

  // Handle score changes
  const handleScoreChange = (key: keyof EvalScores, value: number) => {
    const clamped = Math.max(1, Math.min(10, value));
    setScores((prev) => ({
      ...prev,
      [key]: clamped,
    }));
  };

  // Save evaluation
  const handleSaveEvaluation = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        student_id: selectedStudent.id,
        coach_name: coachName.trim() || user?.email?.split('@')[0] || 'Pelatih Eagle',
        date: evalDate,
        passing: Number(scores.passing),
        dribbling: Number(scores.dribbling),
        ball_control: Number(scores.ball_control),
        shooting: Number(scores.shooting),
        tactical: Number(scores.tactical),
        notes: notes.trim() || null,
      };

      // Try inserting
      let { error } = await supabase.from('performance_evals').insert(payload);

      // Handle potential DB setup where composite_score is not generated automatically
      if (error && error.message && error.message.toLowerCase().includes('composite_score')) {
        const calculatedComposite = Number(liveComposite);
        const retryResult = await supabase
          .from('performance_evals')
          .insert({ ...payload, composite_score: calculatedComposite });
        error = retryResult.error;
      }

      if (error) throw error;

      if (showNotification) {
        showNotification(`Evaluasi performa ${selectedStudent.name} berhasil disimpan!`);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (error: any) {
      console.error('Error saving performance evaluation:', error);
      alert('Gagal menyimpan evaluasi: ' + (error.message || 'Terjadi kesalahan sistem'));
    } finally {
      setSaving(false);
    }
  };

  // Helper for score badge styling
  const getScoreBadge = (score: number | null) => {
    if (score === null) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
          Belum Dinilai
        </span>
      );
    }

    if (score >= 8.5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Star size={12} className="fill-emerald-600 text-emerald-600" />
          {score.toFixed(1)} / 10
        </span>
      );
    }
    if (score >= 7.0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
          <Star size={12} className="fill-green-600 text-green-600" />
          {score.toFixed(1)} / 10
        </span>
      );
    }
    if (score >= 5.5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Star size={12} className="fill-amber-600 text-amber-600" />
          {score.toFixed(1)} / 10
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <Star size={12} className="fill-rose-600 text-rose-600" />
        {score.toFixed(1)} / 10
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-800 text-yellow-400 rounded-xl shadow-sm">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Performa Atlet & Evaluasi Skill
              </h1>
              <p className="text-sm text-gray-500">
                Pencatatan radar skill siswa: Passing, Dribbling, Ball Control, Shooting, & Tactical
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm self-start sm:self-auto">
          <Clock size={14} className="text-green-700" />
          <span>Update Terakhir: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Siswa Aktif</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalStudents}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <User size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Siswa Dinilai</p>
            <p className="text-2xl font-black text-green-700 mt-1">{stats.evaluatedStudentsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-700">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Belum Dinilai</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rata-Rata Akademi</p>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="text-2xl font-black text-yellow-600">{stats.averageAcademyScore}</p>
              {stats.averageAcademyScore !== '-' && <span className="text-xs text-gray-400">/ 10</span>}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
            <Star size={20} className="fill-yellow-500 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari siswa berdasarkan nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Cohort Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'U-5', 'U-8', 'U-12', 'U-15'].map((cohort) => (
              <button
                key={cohort}
                onClick={() => setCohortFilter(cohort)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  cohortFilter === cohort
                    ? 'bg-green-900 text-yellow-400 shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cohort === 'ALL' ? 'Semua Cohort' : cohort}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 border-t md:border-t-0 md:border-l border-gray-200 pt-2 md:pt-0 md:pl-3">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('EVALUATED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'EVALUATED' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Dinilai
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Belum
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-green-800" />
            <h2 className="font-bold text-gray-800 text-sm sm:text-base">
              Daftar Evaluasi Siswa
            </h2>
            <span className="text-xs bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
              {filteredStudents.length} Atlet
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Klik tombol <span className="font-semibold text-green-800">"Nilai"</span> untuk menginput atau memperbarui skor evaluasi.
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Memuat data atlet & performa...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <Activity className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="font-semibold text-gray-700">Tidak ada atlet ditemukan</p>
            <p className="text-xs text-gray-400">Coba ubah kriteria pencarian atau filter kelompok usia</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-5 py-3.5 font-semibold">Atlet Siswa</th>
                  <th className="px-4 py-3.5 font-semibold">Kelompok</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Skor Komposit</th>
                  <th className="px-4 py-3.5 font-semibold hidden md:table-cell">Radar Skill (P / D / C / S / T)</th>
                  <th className="px-4 py-3.5 font-semibold hidden lg:table-cell">Evaluasi Terakhir</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => {
                  const latest = latestEvalByStudent[student.id];
                  const studentEvals = evalsByStudent[student.id] || [];
                  const compScore = getCompositeScore(latest);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-900 font-bold flex items-center justify-center text-sm border border-green-200 shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                              <span>{student.name}</span>
                              {student.jersey_number && (
                                <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded font-bold">
                                  #{student.jersey_number}
                                </span>
                              )}
                            </div>
                            {student.full_name && student.full_name !== student.name && (
                              <p className="text-xs text-gray-400 line-clamp-1">{student.full_name}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cohort */}
                      <td className="px-4 py-3.5">
                        <span className="bg-green-50 text-green-800 border border-green-200 py-1 px-2.5 rounded-md text-xs font-semibold">
                          {student.age_cohort}
                        </span>
                      </td>

                      {/* Composite Score */}
                      <td className="px-4 py-3.5 text-center">
                        {getScoreBadge(compScore)}
                      </td>

                      {/* Skill breakdown chips (Mini) */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {latest ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded" title={`Passing: ${latest.passing}`}>
                              P:{latest.passing}
                            </span>
                            <span className="text-[11px] font-mono font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded" title={`Dribbling: ${latest.dribbling}`}>
                              D:{latest.dribbling}
                            </span>
                            <span className="text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded" title={`Ball Control: ${latest.ball_control}`}>
                              C:{latest.ball_control}
                            </span>
                            <span className="text-[11px] font-mono font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded" title={`Shooting: ${latest.shooting}`}>
                              S:{latest.shooting}
                            </span>
                            <span className="text-[11px] font-mono font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded" title={`Tactical: ${latest.tactical}`}>
                              T:{latest.tactical}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum ada catatan skor</span>
                        )}
                      </td>

                      {/* Latest Evaluation Date & Coach */}
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-600">
                        {latest ? (
                          <div>
                            <p className="font-medium text-gray-800">
                              {new Date(latest.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-[11px] text-gray-400">Oleh: {latest.coach_name || 'Pelatih'}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {studentEvals.length > 0 && (
                            <button
                              onClick={() => setHistoryStudent(student)}
                              className="p-1.5 text-gray-500 hover:text-green-800 hover:bg-green-50 rounded-lg text-xs font-medium transition-colors"
                              title="Lihat Riwayat Evaluasi"
                            >
                              <History size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEvalModal(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-800 hover:bg-green-900 text-yellow-400 font-semibold rounded-lg text-xs shadow-sm transition-all active:scale-95"
                          >
                            <SlidersHorizontal size={14} />
                            <span>{latest ? 'Update Nilai' : 'Nilai'}</span>
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

      {/* EVALUATION MODAL */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-green-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-yellow-500 text-green-950 font-black flex items-center justify-center text-base shadow-inner">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white leading-tight">
                      Evaluasi: {selectedStudent.name}
                    </h3>
                    <span className="bg-green-800 text-yellow-400 text-xs px-2 py-0.5 rounded font-semibold border border-green-700">
                      {selectedStudent.age_cohort}
                    </span>
                  </div>
                  <p className="text-xs text-green-200 mt-0.5">
                    {selectedStudent.full_name || 'Atlet Eagle Futsal Academy'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-green-300 hover:text-white p-1 rounded-lg hover:bg-green-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Composite Score Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-green-500/10 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Skor Komposit Terkalkulasi
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Rata-rata dari 5 pilar keterampilan teknis futsal
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-yellow-200">
                <Star size={22} className="fill-yellow-500 text-yellow-500" />
                <span className="text-2xl font-black text-gray-900">{liveComposite}</span>
                <span className="text-xs font-bold text-gray-400">/ 10</span>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEvaluation} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Date & Coach Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar size={14} className="text-green-800" />
                    Tanggal Evaluasi
                  </label>
                  <input
                    type="date"
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User size={14} className="text-green-800" />
                    Nama Pelatih Penilai
                  </label>
                  <input
                    type="text"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    placeholder="Contoh: Coach Adit"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* 5 Skills Sliders & Inputs */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Activity size={14} className="text-green-800" />
                  Penilaian 5 Pilar Keterampilan (Skala 1 - 10)
                </h4>

                <div className="space-y-4">
                  {SKILL_CONFIG.map((skill) => {
                    const val = scores[skill.key];
                    return (
                      <div
                        key={skill.key}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <span className={`text-sm font-bold ${skill.color}`}>
                              {skill.label}
                            </span>
                            <span className="text-xs text-gray-400 block sm:inline sm:ml-2">
                              {skill.subLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={val}
                              onChange={(e) => handleScoreChange(skill.key, parseInt(e.target.value) || 1)}
                              className="w-14 text-center font-bold text-sm py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                            />
                            <span className="text-xs font-semibold text-gray-400">/ 10</span>
                          </div>
                        </div>

                        {/* Slider */}
                        <div className="flex items-center gap-3 pt-2">
                          <span className="text-xs font-bold text-gray-400 w-4 text-center">1</span>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            step={1}
                            value={val}
                            onChange={(e) => handleScoreChange(skill.key, parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-800"
                          />
                          <span className="text-xs font-bold text-gray-400 w-4 text-center">10</span>
                        </div>

                        {/* Quick Selection Pills */}
                        <div className="flex items-center justify-between gap-1 pt-3">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleScoreChange(skill.key, num)}
                              className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
                                val === num
                                  ? 'bg-green-800 text-yellow-400 shadow-sm scale-105'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Catatan Pelatih & Rencana Pengembangan
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Berikan masukan mengenai keunggulan atlet, evaluasi pertandingan/latihan terakhir, atau hal yang perlu ditingkatkan..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-green-800 hover:bg-green-900 text-yellow-400 font-bold rounded-lg text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Simpan Evaluasi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-500 text-slate-950 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Riwayat Evaluasi: {historyStudent.name}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Cohort {historyStudent.age_cohort} • Total {(evalsByStudent[historyStudent.id] || []).length} evaluasi tercatat
                  </p>
                </div>
              </div>

              <button
                onClick={() => setHistoryStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {(evalsByStudent[historyStudent.id] || []).map((ev, index) => {
                const comp = getCompositeScore(ev);
                return (
                  <div
                    key={ev.id || index}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Calendar size={14} className="text-green-800" />
                        <span>
                          {new Date(ev.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">Pelatih: {ev.coach_name || 'Pelatih'}</span>
                      </div>

                      {getScoreBadge(comp)}
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-5 gap-2 pt-1 text-center">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-blue-700 block">Passing</span>
                        <span className="text-sm font-black text-blue-900">{ev.passing}</span>
                      </div>
                      <div className="bg-amber-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-amber-700 block">Dribble</span>
                        <span className="text-sm font-black text-amber-900">{ev.dribbling}</span>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block">Control</span>
                        <span className="text-sm font-black text-emerald-900">{ev.ball_control}</span>
                      </div>
                      <div className="bg-rose-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-rose-700 block">Shoot</span>
                        <span className="text-sm font-black text-rose-900">{ev.shooting}</span>
                      </div>
                      <div className="bg-purple-50 p-2 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-purple-700 block">Tactical</span>
                        <span className="text-sm font-black text-purple-900">{ev.tactical}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {ev.notes && (
                      <div className="text-xs bg-white p-3 rounded-lg border border-gray-200 text-gray-700">
                        <span className="font-semibold text-gray-900 block mb-0.5">Catatan:</span>
                        {ev.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
              <button
                onClick={() => setHistoryStudent(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
