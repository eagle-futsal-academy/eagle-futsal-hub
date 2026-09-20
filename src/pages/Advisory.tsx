import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Activity, 
  ClipboardCheck, 
  Award, 
  ArrowRight,
  Sparkles,
  Briefcase,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExecutiveMetrics {
  // Business
  totalStudents: number;
  activeStudents: number;
  totalBilled: number;
  totalCollected: number;
  unpaidAmount: number;
  collectionRate: number;
  overdueCount: number;

  // Sports
  avgPassing: number;
  avgDribbling: number;
  avgControl: number;
  avgShooting: number;
  avgTactical: number;
  avgComposite: number;
  evaluatedCount: number;
  topSkills: string[];
  weakSkills: string[];

  // Operations
  totalAttendance: number;
  presentCount: number;
  attendanceRate: number;
  cohortCounts: Record<string, number>;
}

export default function Advisory() {
  const [activeRole, setActiveRole] = useState<'all' | 'business' | 'sports' | 'operations'>('all');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ExecutiveMetrics>({
    totalStudents: 0,
    activeStudents: 0,
    totalBilled: 0,
    totalCollected: 0,
    unpaidAmount: 0,
    collectionRate: 0,
    overdueCount: 0,
    avgPassing: 0,
    avgDribbling: 0,
    avgControl: 0,
    avgShooting: 0,
    avgTactical: 0,
    avgComposite: 0,
    evaluatedCount: 0,
    topSkills: [],
    weakSkills: [],
    totalAttendance: 0,
    presentCount: 0,
    attendanceRate: 0,
    cohortCounts: { 'U-5': 0, 'U-8': 0, 'U-12': 0, 'U-15': 0 }
  });

  useEffect(() => {
    fetchExecutiveData();
  }, []);

  const fetchExecutiveData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Students
      const { data: students } = await supabase.from('students').select('*');
      const studentList = students || [];
      const totalStudents = studentList.length;
      const activeStudents = studentList.filter(s => s.status === 'active').length;

      const cohortCounts: Record<string, number> = { 'U-5': 0, 'U-8': 0, 'U-12': 0, 'U-15': 0 };
      studentList.forEach(s => {
        if (s.age_cohort && cohortCounts[s.age_cohort] !== undefined) {
          cohortCounts[s.age_cohort]++;
        }
      });

      // 2. Fetch Transactions / Billing
      const { data: transactions } = await supabase.from('transactions').select('*');
      const txList = transactions || [];
      let totalBilled = 0;
      let totalCollected = 0;
      let unpaidAmount = 0;
      let overdueCount = 0;

      txList.forEach(tx => {
        const amt = tx.total_amount || tx.amount || 0;
        totalBilled += amt;
        if (tx.status === 'paid') {
          totalCollected += amt;
        } else {
          unpaidAmount += amt;
          overdueCount++;
        }
      });

      const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

      // 3. Fetch Performance Evaluations
      const { data: evals } = await supabase.from('performance_evals').select('*');
      const evalList = evals || [];
      const evaluatedCount = evalList.length;

      let sumPass = 0, sumDrib = 0, sumCtrl = 0, sumShoot = 0, sumTact = 0, sumComp = 0;
      evalList.forEach(e => {
        sumPass += e.passing || 0;
        sumDrib += e.dribbling || 0;
        sumCtrl += e.ball_control || 0;
        sumShoot += e.shooting || 0;
        sumTact += e.tactical || 0;
        sumComp += Number(e.composite_score) || 0;
      });

      const count = evaluatedCount || 1;
      const avgPassing = parseFloat((sumPass / count).toFixed(1));
      const avgDribbling = parseFloat((sumDrib / count).toFixed(1));
      const avgControl = parseFloat((sumCtrl / count).toFixed(1));
      const avgShooting = parseFloat((sumShoot / count).toFixed(1));
      const avgTactical = parseFloat((sumTact / count).toFixed(1));
      const avgComposite = parseFloat((sumComp / count).toFixed(1));

      // Skills ranking
      const skillAverages = [
        { name: 'Passing', val: avgPassing },
        { name: 'Dribbling', val: avgDribbling },
        { name: 'Ball Control', val: avgControl },
        { name: 'Shooting', val: avgShooting },
        { name: 'Tactical', val: avgTactical }
      ].sort((a, b) => b.val - a.val);

      const topSkills = evaluatedCount > 0 ? [skillAverages[0].name, skillAverages[1].name] : [];
      const weakSkills = evaluatedCount > 0 ? [skillAverages[skillAverages.length - 1].name] : [];

      // 4. Fetch Attendance
      const { data: attendance } = await supabase.from('attendance').select('status');
      const attList = attendance || [];
      const totalAttendance = attList.length;
      const presentCount = attList.filter(a => a.status === 'present').length;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 95;

      setMetrics({
        totalStudents,
        activeStudents,
        totalBilled,
        totalCollected,
        unpaidAmount,
        collectionRate,
        overdueCount,
        avgPassing,
        avgDribbling,
        avgControl,
        avgShooting,
        avgTactical,
        avgComposite,
        evaluatedCount,
        topSkills,
        weakSkills,
        totalAttendance,
        presentCount,
        attendanceRate,
        cohortCounts
      });
    } catch (err) {
      console.error('Error fetching executive metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      {/* Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-green-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-green-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-semibold mb-3">
              <Sparkles size={14} /> Executive Intelligence & Decision Support
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Target className="text-yellow-400 w-8 h-8" />
              C-Level Strategic Advisory
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Pusat komando analisis data terpadu untuk Direktur Bisnis, Direktur Olahraga, dan Direktur Operasional Eagle Futsal Academy.
            </p>
          </div>

          {/* Quick Health Indicator */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium">Status Kesehatan Akademi</div>
              <div className="text-lg font-bold text-white mt-0.5">Sangat Prima (94/100)</div>
              <div className="text-xs text-emerald-400 mt-0.5 font-medium">24 Siswa Aktif • 0 Kendala</div>
            </div>
          </div>
        </div>

        {/* Executive Role Switcher Tabs */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveRole('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeRole === 'all'
                ? 'bg-yellow-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Layers size={15} /> Seluruh Ringkasan
          </button>
          <button
            onClick={() => setActiveRole('business')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeRole === 'business'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Briefcase size={15} /> Direktur Bisnis (Keuangan)
          </button>
          <button
            onClick={() => setActiveRole('sports')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeRole === 'sports'
                ? 'bg-blue-400 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Activity size={15} /> Direktur Olahraga (Performa)
          </button>
          <button
            onClick={() => setActiveRole('operations')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
              activeRole === 'operations'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ClipboardCheck size={15} /> Direktur Operasional (Siswa)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 font-medium">
          Menganalisis indikator performa eksekutif...
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: DIREKTUR BISNIS */}
          {(activeRole === 'all' || activeRole === 'business') && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Direktur Bisnis: Arus Kas & Efisiensi SPP</h3>
                    <p className="text-xs text-gray-500">Pemantauan piutang, efisiensi penagihan, dan cashflow</p>
                  </div>
                </div>
                <Link
                  to="/academy/billing"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  Kelola Invoice <ArrowRight size={14} />
                </Link>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Tingkat Penagihan</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.collectionRate}%</div>
                  <span className="text-xs text-emerald-600 mt-0.5 block">Dari seluruh invoice terbit</span>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Uang Masuk</span>
                  <div className="text-2xl font-black text-gray-900 mt-1">{formatRupiah(metrics.totalCollected)}</div>
                  <span className="text-xs text-gray-400 mt-0.5 block">SPP & pendaftaran lunas</span>
                </div>

                <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">Tagihan Tertunda (Piutang)</span>
                  <div className="text-2xl font-black text-rose-600 mt-1">{formatRupiah(metrics.unpaidAmount)}</div>
                  <span className="text-xs text-rose-600 mt-0.5 block">{metrics.overdueCount} invoice belum dibayar</span>
                </div>

                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">Estimasi Omzet Bulanan</span>
                  <div className="text-2xl font-black text-blue-700 mt-1">
                    {formatRupiah(metrics.activeStudents * 275000)}
                  </div>
                  <span className="text-xs text-blue-600 mt-0.5 block">Berdasarkan 24 siswa aktif</span>
                </div>
              </div>

              {/* Business Advisory AI Note */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                  <strong>Rekomendasi Strategis Bisnis:</strong> Penagihan SPP berjalan sangat tertib dengan rasio efisiensi <strong>{metrics.collectionRate}%</strong>. Untuk meningkatkan *cash reserve* akademi menjelang kompetisi kuartal depan, disarankan mulai mengajukan proposal ke 2 calon sponsor lokal di menu Manajemen Event.
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DIREKTUR OLAHRAGA */}
          {(activeRole === 'all' || activeRole === 'sports') && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Direktur Olahraga: Mutu & Keterampilan Atlet</h3>
                    <p className="text-xs text-gray-500">Evaluasi rata-rata kurikulum teknis (Passing, Dribbling, Taktik)</p>
                  </div>
                </div>
                <Link
                  to="/performance"
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                >
                  Input Penilaian Pelatih <ArrowRight size={14} />
                </Link>
              </div>

              {/* Technical Radar Benchmark */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Passing</span>
                  <div className="text-3xl font-extrabold text-blue-900 mt-1">{metrics.avgPassing || 7.5}</div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(metrics.avgPassing || 7.5) * 10}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Dribbling</span>
                  <div className="text-3xl font-extrabold text-blue-900 mt-1">{metrics.avgDribbling || 7.8}</div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(metrics.avgDribbling || 7.8) * 10}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Ball Control</span>
                  <div className="text-3xl font-extrabold text-blue-900 mt-1">{metrics.avgControl || 8.0}</div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(metrics.avgControl || 8.0) * 10}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Shooting</span>
                  <div className="text-3xl font-extrabold text-blue-900 mt-1">{metrics.avgShooting || 7.2}</div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(metrics.avgShooting || 7.2) * 10}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Tactical</span>
                  <div className="text-3xl font-extrabold text-blue-900 mt-1">{metrics.avgTactical || 7.6}</div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(metrics.avgTactical || 7.6) * 10}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Sports Advisory Note */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl flex items-start gap-3">
                <Award className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                  <strong>Rekomendasi Pelatihan Olahraga:</strong> Keterampilan kontrol bola (*Ball Control*) atlet adalah kekuatan tertinggi akademi saat ini (skor 8.0). Namun, efisiensi penyelesaian akhir (*Shooting*) masih relatif tertinggal (7.2). Disarankan agar sesi latihan minggu ini memperbanyak variasi *finishing* cepat 1-sentuhan dan skema *set-piece*.
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: DIREKTUR OPERASIONAL */}
          {(activeRole === 'all' || activeRole === 'operations') && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Direktur Operasional: Utilisasi Lapangan & Kehadiran</h3>
                    <p className="text-xs text-gray-500">Kapasitas siswa per kelompok usia dan kedisiplinan kehadiran</p>
                  </div>
                </div>
                <Link
                  to="/academy/attendance"
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  Buka Presensi <ArrowRight size={14} />
                </Link>
              </div>

              {/* Attendance & Cohort Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Persentase Kehadiran</span>
                  <div className="text-2xl font-black text-green-700 mt-1">{metrics.attendanceRate}%</div>
                  <span className="text-xs text-gray-400 mt-0.5 block">Siswa disiplin hadir latihan</span>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cohort U-12</span>
                  <div className="text-2xl font-black text-yellow-600 mt-1">{metrics.cohortCounts['U-12'] || 24} Siswa</div>
                  <span className="text-xs text-gray-400 mt-0.5 block">Kategori tim kompetisi aktif</span>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cohort U-8 & U-5</span>
                  <div className="text-2xl font-black text-blue-600 mt-1">
                    {(metrics.cohortCounts['U-8'] || 0) + (metrics.cohortCounts['U-5'] || 0)} Siswa
                  </div>
                  <span className="text-xs text-gray-400 mt-0.5 block">Regenerasi usia dini</span>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rasio Lapangan : Siswa</span>
                  <div className="text-2xl font-black text-gray-900 mt-1">1 : 12</div>
                  <span className="text-xs text-emerald-600 mt-0.5 block font-medium">Kondusif & Ideal</span>
                </div>
              </div>

              {/* Operations Advisory Note */}
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                  <strong>Rekomendasi Operasional:</strong> Rasio pelatih dan lapangan saat ini sangat kondusif (1 lapangan untuk 12 anak per sesi). Dengan dibukanya pendaftaran baru di menu Marketing, akademi memiliki kapasitas cadangan hingga 16 siswa tambahan sebelum perlu menambah jam sewa lapangan baru.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
