import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Star, 
  Search, 
  X, 
  Save, 
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface StudentItem {
  id: string;
  name: string;
  full_name: string;
  jersey_number?: number;
  age_cohort: string;
  photo_url?: string;
  latest_score?: number;
  last_evaluated?: string;
}

export default function CoachScoring() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState<string>('U-12');
  const [search, setSearch] = useState('');
  const [filterEvaluated, setFilterEvaluated] = useState<'all' | 'pending' | 'evaluated'>('all');

  // Active student being evaluated in mobile modal
  const [activeStudent, setActiveStudent] = useState<StudentItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [coachName, setCoachName] = useState('Coach Eagle');
  const [evalDate, setEvalDate] = useState(new Date().toISOString().slice(0, 10));

  // Scores (1-10)
  const [passing, setPassing] = useState<number>(7);
  const [dribbling, setDribbling] = useState<number>(7);
  const [ballControl, setBallControl] = useState<number>(7);
  const [shooting, setShooting] = useState<number>(7);
  const [tactical, setTactical] = useState<number>(7);
  const [notes, setNotes] = useState('');

  // Quick feedback tag pills
  const quickTags = [
    'Kontrol bola mantap',
    'Finishing tajam',
    'Disiplin posisi',
    'Perlu asah shooting',
    'Passing akurat',
    'Stamina luar biasa',
    'Visi bermain bagus'
  ];

  useEffect(() => {
    fetchStudentsWithEvals();
  }, []);

  const fetchStudentsWithEvals = async () => {
    try {
      setLoading(true);

      // 1. Fetch Students
      const { data: stData, error: stErr } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .order('jersey_number', { ascending: true, nullsFirst: false });

      if (stErr) throw stErr;

      // 2. Fetch Latest Performance Evals
      const { data: evData } = await supabase
        .from('performance_evals')
        .select('*')
        .order('date', { ascending: false });

      const evalsMap: Record<string, { score: number; date: string }> = {};
      (evData || []).forEach(ev => {
        if (!evalsMap[ev.student_id]) {
          evalsMap[ev.student_id] = {
            score: Number(ev.composite_score) || 0,
            date: ev.date
          };
        }
      });

      const merged: StudentItem[] = (stData || []).map(s => ({
        id: s.id,
        name: s.name,
        full_name: s.full_name,
        jersey_number: s.jersey_number,
        age_cohort: s.age_cohort,
        photo_url: s.photo_url,
        latest_score: evalsMap[s.id]?.score,
        last_evaluated: evalsMap[s.id]?.date
      }));

      setStudents(merged);
    } catch (err) {
      console.error('Error fetching students for scoring:', err);
    } finally {
      setLoading(false);
    }
  };

  const openScoringModal = (student: StudentItem) => {
    setActiveStudent(student);
    setPassing(7);
    setDribbling(7);
    setBallControl(7);
    setShooting(7);
    setTactical(7);
    setNotes('');
  };

  // Calculated composite score
  const compositeScore = ((passing + dribbling + ballControl + shooting + tactical) / 5).toFixed(1);

  const handleSaveEvaluation = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;

    try {
      setSaving(true);
      const payload = {
        student_id: activeStudent.id,
        coach_name: coachName,
        date: evalDate,
        passing,
        dribbling,
        ball_control: ballControl,
        shooting,
        tactical,
        notes
      };

      const { error } = await supabase.from('performance_evals').insert([payload]);
      if (error) throw error;

      // Update local state
      setStudents(prev => prev.map(s => {
        if (s.id === activeStudent.id) {
          return {
            ...s,
            latest_score: parseFloat(compositeScore),
            last_evaluated: evalDate
          };
        }
        return s;
      }));

      setActiveStudent(null);
    } catch (err) {
      console.error('Error saving eval:', err);
      alert('Gagal menyimpan nilai evaluasi.');
    } finally {
      setSaving(false);
    }
  };

  // Filter list
  const filteredStudents = students.filter(s => {
    const matchesCohort = selectedCohort === 'ALL' || s.age_cohort === selectedCohort;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.full_name && s.full_name.toLowerCase().includes(search.toLowerCase())) ||
                          (s.jersey_number && s.jersey_number.toString().includes(search));
    const matchesEval = filterEvaluated === 'all' 
      ? true 
      : filterEvaluated === 'evaluated' 
      ? !!s.latest_score 
      : !s.latest_score;

    return matchesCohort && matchesSearch && matchesEval;
  });

  return (
    <div className="p-3 sm:p-6 w-full max-w-5xl mx-auto space-y-4">
      {/* Mobile-Optimized Header */}
      <div className="bg-gradient-to-r from-green-950 to-emerald-900 rounded-2xl p-4 sm:p-6 text-white shadow-md border border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-400 text-green-950 rounded-xl">
              <Smartphone size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Papan Penilaian Pelatih</h1>
              <p className="text-xs text-green-200">Evaluasi performa atlet di pinggir lapangan</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-xs font-bold rounded-lg">
            Mode Lapangan
          </span>
        </div>

        {/* Cohort Selector Pills (Touch Friendly) */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1">
          {['U-12', 'U-8', 'U-15', 'U-5', 'ALL'].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCohort(c)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                selectedCohort === c
                  ? 'bg-yellow-400 text-green-950 shadow-md scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {c === 'ALL' ? 'Semua Kelas' : `Cohort ${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau no. punggung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setFilterEvaluated('all')}
            className={`px-3 py-1.5 rounded-md transition ${filterEvaluated === 'all' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600'}`}
          >
            Semua ({students.length})
          </button>
          <button
            onClick={() => setFilterEvaluated('pending')}
            className={`px-3 py-1.5 rounded-md transition ${filterEvaluated === 'pending' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-gray-600'}`}
          >
            Belum Dinilai
          </button>
          <button
            onClick={() => setFilterEvaluated('evaluated')}
            className={`px-3 py-1.5 rounded-md transition ${filterEvaluated === 'evaluated' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-gray-600'}`}
          >
            Sudah Dinilai
          </button>
        </div>
      </div>

      {/* Player Cards Grid (Large Touch Targets for Mobile) */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm font-medium">Memuat data pemain...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          Tidak ada siswa ditemukan di kategori ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              onClick={() => openScoringModal(student)}
              className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-green-600 shadow-sm transition active:scale-[0.98] cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                {/* Jersey Number Badge */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-900 to-emerald-900 text-yellow-400 font-extrabold flex flex-col items-center justify-center shrink-0 shadow-sm border border-green-800">
                  <span className="text-[9px] uppercase tracking-wider text-green-200 leading-none">NO</span>
                  <span className="text-lg font-black leading-none mt-0.5">
                    {student.jersey_number || '-'}
                  </span>
                </div>

                {/* Name & Cohort */}
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-green-800 transition">
                    {student.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate max-w-[150px] mt-0.5">
                    {student.full_name}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px] font-bold">
                    {student.age_cohort}
                  </span>
                </div>
              </div>

              {/* Latest Score Badge or Action Arrow */}
              <div className="flex flex-col items-end gap-1">
                {student.latest_score ? (
                  <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-xl font-bold text-sm">
                    <Star size={14} className="fill-emerald-600 text-emerald-600" />
                    <span>{student.latest_score}</span>
                  </div>
                ) : (
                  <span className="text-[11px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-semibold">
                    Belum Dinilai
                  </span>
                )}
                <span className="text-[10px] text-green-700 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                  Beri Nilai <ChevronRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MOBILE FULL-SCREEN / BOTTOM-SHEET SCORING MODAL */}
      {activeStudent && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-900 text-yellow-400 font-extrabold flex items-center justify-center shrink-0">
                  {activeStudent.jersey_number ? `#${activeStudent.jersey_number}` : 'ST'}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                    {activeStudent.name}
                  </h3>
                  <p className="text-xs text-gray-500">{activeStudent.full_name}</p>
                </div>
              </div>

              {/* Big Score Callout */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Rata-Rata</span>
                  <span className="text-xl font-black text-emerald-600 flex items-center gap-1">
                    <Star size={16} className="fill-emerald-600 text-emerald-600" /> {compositeScore}
                  </span>
                </div>
                <button
                  onClick={() => setActiveStudent(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Touch-Friendly Sliders & Pills */}
            <form onSubmit={handleSaveEvaluation} className="p-5 space-y-5">
              {/* Tanggal & Pelatih */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Tanggal Evaluasi</label>
                  <input
                    type="date"
                    required
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">Nama Pelatih</label>
                  <input
                    type="text"
                    required
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 font-medium focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 5 Technical Skills with Big Thumb Controls */}
              {[
                { label: 'Passing (Akurasi & Bobot Operan)', val: passing, set: setPassing },
                { label: 'Dribbling (Kelincahan Membawa Bola)', val: dribbling, set: setDribbling },
                { label: 'Ball Control (Kontrol Sentuhan Pertama)', val: ballControl, set: setBallControl },
                { label: 'Shooting (Penyelesaian Akhir & Power)', val: shooting, set: setShooting },
                { label: 'Tactical (Pemahaman Posisi & Transisi)', val: tactical, set: setTactical },
              ].map((skill, sIdx) => (
                <div key={sIdx} className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{skill.label}</span>
                    <span className="text-sm font-black text-green-900 bg-yellow-100 px-2.5 py-0.5 rounded-lg border border-yellow-300">
                      {skill.val} / 10
                    </span>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={skill.val}
                    onChange={(e) => skill.set(parseInt(e.target.value))}
                    className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-800"
                  />

                  {/* 1..10 Quick Tap Pills for Thumb Clicking */}
                  <div className="grid grid-cols-10 gap-1 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => skill.set(num)}
                        className={`h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                          skill.val === num
                            ? 'bg-green-900 text-yellow-400 font-extrabold shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quick Observation Tags */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Catatan Cepat Pelatih (Sentuh untuk Memilih):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickTags.map((tag, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() => {
                        if (!notes.includes(tag)) {
                          setNotes(prev => prev ? `${prev}, ${tag}` : tag);
                        }
                      }}
                      className="text-[11px] bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-900 px-2.5 py-1 rounded-lg border border-gray-200 transition font-medium"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Textarea */}
              <div>
                <textarea
                  rows={2}
                  placeholder="Ketik catatan pengamatan evaluasi siswa di sini..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              {/* Big Bottom Action Button */}
              <div className="pt-2 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-green-900 hover:bg-green-800 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {saving ? (
                    'Menyimpan Nilai...'
                  ) : (
                    <>
                      <Save size={18} /> Simpan Nilai Evaluasi {activeStudent.name}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
