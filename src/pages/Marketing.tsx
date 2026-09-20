import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { 
  Megaphone, 
  Sparkles, 
  Trophy, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Phone, 
  Send,
  MessageCircle,
  Clock,
  Calendar,
  Layers
} from 'lucide-react';

interface StudentRegistration {
  id?: string;
  name: string;
  full_name: string;
  dob: string;
  age_cohort: 'U-5' | 'U-8' | 'U-12' | 'U-15';
  parent_name: string;
  parent_phone: string;
  jersey_size: string;
  medical_notes: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export default function Marketing() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'programs' | 'register' | 'leads'>('programs');
  const [recentRegistrations, setRecentRegistrations] = useState<StudentRegistration[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    fullName: '',
    dob: '',
    ageCohort: 'U-12' as 'U-5' | 'U-8' | 'U-12' | 'U-15',
    parentName: '',
    parentPhone: '',
    jerseySize: 'M',
    medicalNotes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (activeTab === 'leads') {
      fetchRecentRegistrations();
    }
  }, [activeTab]);

  const fetchRecentRegistrations = async () => {
    try {
      setLoadingLeads(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setRecentRegistrations(data);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Helper to suggest cohort based on birth date
  const handleDobChange = (dobValue: string) => {
    setFormData(prev => {
      const birthYear = new Date(dobValue).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      let suggestedCohort: 'U-5' | 'U-8' | 'U-12' | 'U-15' = 'U-12';
      if (age <= 5) suggestedCohort = 'U-5';
      else if (age <= 8) suggestedCohort = 'U-8';
      else if (age <= 12) suggestedCohort = 'U-12';
      else suggestedCohort = 'U-15';

      return {
        ...prev,
        dob: dobValue,
        ageCohort: suggestedCohort
      };
    });
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dob || !formData.parentPhone) {
      alert('Mohon lengkapi data nama, tanggal lahir, dan nomor kontak orang tua.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        full_name: formData.fullName || formData.name,
        dob: formData.dob,
        age_cohort: formData.ageCohort,
        parent_name: formData.parentName,
        parent_phone: formData.parentPhone,
        jersey_size: formData.jerseySize,
        medical_notes: formData.medicalNotes,
        status: 'active'
      };

      const { error } = await supabase.from('students').insert([payload]);
      if (error) throw error;

      setSubmittedSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      alert('Pendaftaran gagal terkirim. Silakan periksa kembali formulir atau hubungi admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const programs = [
    {
      cohort: 'U-5 (Grassroots Fun)',
      age: 'Usia 4 - 5 Tahun',
      description: 'Pengenalan kecintaan pada bola, melatih motorik kasar, koordinasi gerak, dan bersosialisasi lewat permainan yang menyenangkan.',
      schedule: 'Sabtu: 07.30 - 09.00 WIB',
      spp: 'Rp 200.000 / bulan',
      features: ['Fun Games & Ball Familiarity', 'Pelatih Ramah Anak', 'Laporan Tumbuh Kembang']
    },
    {
      cohort: 'U-8 (Basic Mastery)',
      age: 'Usia 6 - 8 Tahun',
      description: 'Pengembangan teknik dasar futsal: dribbling kedua kaki, kontrol bola dasar, akurasi operan pendek, dan sportivitas tim.',
      schedule: 'Sabtu & Minggu: 08.00 - 09.30 WIB',
      spp: 'Rp 250.000 / bulan',
      features: ['Fundamental Skills (Pass & Move)', 'Mini Game 3 vs 3', 'Uji Tanding Berkala']
    },
    {
      cohort: 'U-12 (Tactical & League)',
      age: 'Usia 9 - 12 Tahun',
      description: 'Pemahaman taktik formasi (Anchor, Flank, Pivot), rotasi permainan, transisi bertahan & menyerang, serta persiapan liga resmi.',
      schedule: 'Rabu & Sabtu: 15.30 - 17.30 WIB',
      spp: 'Rp 300.000 / bulan',
      features: ['Taktik & Visi Bermain', 'Kebugaran Fisik & Agility', 'Mengikuti Turnamen Resmi']
    },
    {
      cohort: 'U-15 (Elite Preparation)',
      age: 'Usia 13 - 15 Tahun',
      description: 'Persiapan atlet menuju kompetisi tingkat kota/nasional. Fokus pada kecepatan berpikir, eksekusi set-piece, dan mental bertanding tangguh.',
      schedule: 'Selasa, Kamis & Minggu: 16.00 - 18.00 WIB',
      spp: 'Rp 350.000 / bulan',
      features: ['Analisis Video Pertandingan', 'Latihan Intensitas Tinggi (RPE)', 'Peluang Beasiswa Futsal']
    }
  ];

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-green-950 via-green-900 to-emerald-900 rounded-3xl p-6 sm:p-10 text-white overflow-hidden shadow-lg border border-green-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold mb-3 border border-yellow-500/30">
            <Sparkles size={14} /> Pendaftaran Gelombang Baru Dibuka!
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Eagle Futsal Academy
          </h1>
          <p className="mt-2 text-green-100 text-sm sm:text-base leading-relaxed">
            Membentuk Karakter, Disiplin, dan Skill Futsal Juara Sejak Usia Dini. Kurikulum terstruktur dari usia 4 hingga 15 tahun dengan fasilitas lapangan standar profesional.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setSubmittedSuccess(false);
                setActiveTab('register');
              }}
              className="bg-yellow-500 text-green-950 font-bold px-6 py-2.5 rounded-xl hover:bg-yellow-400 transition shadow-md flex items-center gap-2 text-sm"
            >
              <Send size={16} /> Daftar Sekarang Secara Online
            </button>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20Eagle%20Futsal,%20saya%20ingin%20tanya%20informasi%20pendaftaran%20siswa%20baru"
              target="_blank"
              rel="noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl transition border border-white/20 flex items-center gap-2 text-sm"
            >
              <MessageCircle size={16} className="text-emerald-400" /> Tanya Admin via WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('programs')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'programs'
              ? 'bg-green-900 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Layers size={16} /> Program & Biaya Latihan
        </button>
        <button
          onClick={() => {
            setSubmittedSuccess(false);
            setActiveTab('register');
          }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'register'
              ? 'bg-green-900 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Send size={16} /> Formulir Pendaftaran Online
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'leads'
                ? 'bg-green-900 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users size={16} /> Calon Siswa Baru ({recentRegistrations.length})
          </button>
        )}
      </div>

      {/* Tab Content: Programs */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          {/* Key Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-green-100 text-green-800 rounded-xl">
                <Trophy size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Kurikulum Berjenjang</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Materi latihan disusun spesifik sesuai tahapan usia dan perkembangan atlet usia muda (LTAD).
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-yellow-100 text-yellow-800 rounded-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Pelatih Berlisensi</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Didampingi oleh coach berpengalaman dan berlisensi resmi Federasi Futsal Indonesia.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Ajang Kompetisi Resmi</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Siswa berkesempatan mewakili tim Eagle Futsal dalam turnamen dan liga futsal bergengsi.
                </p>
              </div>
            </div>
          </div>

          {/* Cohort Programs Grid */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Megaphone className="text-green-700" /> Pilihan Kelompok Usia (Cohort)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {programs.map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:border-green-600 transition group">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-green-100 text-green-900 text-xs font-bold rounded-full">
                        {item.age}
                      </span>
                      <span className="text-sm font-bold text-yellow-600">
                        {item.spp}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mt-3 group-hover:text-green-800 transition">
                      {item.cohort}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} className="text-green-700" />
                        <span className="font-semibold text-gray-700">Jadwal:</span> {item.schedule}
                      </div>
                      <div className="space-y-1.5 pt-1">
                        {item.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Pendaftaran include: Jersey & Kaos Kaki</span>
                    <button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          ageCohort: item.cohort.split(' ')[0] as any
                        });
                        setActiveTab('register');
                      }}
                      className="bg-green-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-800 transition"
                    >
                      Pilih Kelas Ini
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Registration Form */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
          {submittedSuccess ? (
            <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Pendaftaran Berhasil Terkirim!</h3>
              <p className="text-gray-600 max-w-md mx-auto text-sm">
                Terima kasih atas kepercayaan Anda kepada Eagle Futsal Academy. Data calon siswa atas nama <strong className="text-green-900">{formData.name}</strong> telah tersimpan di sistem kami.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <a
                  href={`https://wa.me/6281234567890?text=Halo%20Admin%20Eagle%20Futsal,%20saya%20sudah%20mendaftarkan%20anak%20saya:%0ANama:%20${encodeURIComponent(formData.name)}%0AKelas:%20${formData.ageCohort}%0AMohon%20konfirmasi%20jadwal%20latihannya.`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  <MessageCircle size={18} /> Konfirmasi ke Admin via WhatsApp
                </a>
                <button
                  onClick={() => {
                    setFormData(initialForm);
                    setSubmittedSuccess(false);
                  }}
                  className="px-5 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
                >
                  Daftarkan Siswa Lain
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-xl font-bold text-gray-900">Formulir Pendaftaran Siswa Baru</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Isi formulir di bawah ini dengan benar. Data otomatis tersinkronisasi ke sistem siswa akademi.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Nama Panggilan & Nama Lengkap */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Nama Panggilan Anak *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Zidane"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Nama Lengkap Siswa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Zidane Al-Faruq"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tanggal Lahir & Kelompok Usia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center gap-1">
                      <Calendar size={13} /> Tanggal Lahir Anak *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Kelompok Usia (Cohort) *
                    </label>
                    <select
                      value={formData.ageCohort}
                      onChange={(e) => setFormData({ ...formData, ageCohort: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                    >
                      <option value="U-5">U-5 (Usia 4 - 5 Tahun)</option>
                      <option value="U-8">U-8 (Usia 6 - 8 Tahun)</option>
                      <option value="U-12">U-12 (Usia 9 - 12 Tahun)</option>
                      <option value="U-15">U-15 (Usia 13 - 15 Tahun)</option>
                    </select>
                  </div>
                </div>

                {/* Data Orang Tua / Kontak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Nama Orang Tua / Wali *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bapak Hendra"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center gap-1">
                      <Phone size={13} /> No. WhatsApp Aktif *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Ukuran Jersey & Catatan Khusus */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Ukuran Jersey Anak
                    </label>
                    <select
                      value={formData.jerseySize}
                      onChange={(e) => setFormData({ ...formData, jerseySize: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                    >
                      <option value="XS">XS (Balita)</option>
                      <option value="S">S (Anak Kecil)</option>
                      <option value="M">M (Anak Sedang)</option>
                      <option value="L">L (Anak Besar)</option>
                      <option value="XL">XL (Remaja)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Catatan Medis / Alergi (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Memiliki asma ringan, alergi dingin"
                      value={formData.medicalNotes}
                      onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-800 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {submitting ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran Siswa Baru'}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Data Anda aman dan langsung diterima oleh staf pendaftaran Eagle Futsal Academy.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Leads (Admin Only) */}
      {activeTab === 'leads' && isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Daftar Pendaftar & Siswa Terbaru</h3>
              <p className="text-xs text-gray-500">Hubungi orang tua secara langsung melalui WhatsApp untuk konfirmasi.</p>
            </div>
            <button
              onClick={fetchRecentRegistrations}
              className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Refresh
            </button>
          </div>

          {loadingLeads ? (
            <div className="p-8 text-center text-gray-500 text-sm">Memuat data pendaftar...</div>
          ) : recentRegistrations.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Belum ada pendaftar baru.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3.5 px-4 font-semibold">Nama Siswa</th>
                    <th className="py-3.5 px-4 font-semibold">Kelas (Cohort)</th>
                    <th className="py-3.5 px-4 font-semibold">Orang Tua</th>
                    <th className="py-3.5 px-4 font-semibold">Kontak WA</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentRegistrations.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.full_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md">
                          {student.age_cohort}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {student.parent_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {student.parent_phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {student.parent_phone ? (
                          <a
                            href={`https://wa.me/${student.parent_phone.replace(/\D/g, '')}?text=Halo%20Bapak/Ibu%20${encodeURIComponent(student.parent_name || '')},%20terima%20kasih%20telah%20mendaftarkan%20ananda%20${encodeURIComponent(student.name)}%20di%20Eagle%20Futsal%20Academy.`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                          >
                            <MessageCircle size={14} /> Chat WA
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">Tidak ada nomor</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
