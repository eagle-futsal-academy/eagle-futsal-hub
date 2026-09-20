import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useData } from '../contexts/DataContext';
import { 
  CalendarRange, 
  CheckCircle2, 
  Clock, 
  Circle, 
  Plus, 
  X, 
  Trash2, 
  Building2, 
  MessageCircle, 
  User
} from 'lucide-react';

interface EventTask {
  id: string;
  competition_id?: string;
  title: string;
  description?: string;
  phase: 'pre-event' | 'event-day' | 'post-event';
  assigned_to?: string;
  status: 'todo' | 'in-progress' | 'done';
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  created_at?: string;
}

interface Sponsor {
  id: string;
  competition_id?: string;
  brand_name: string;
  tier: 'utama' | 'pendukung' | 'media';
  package_fee?: number;
  impressions?: number;
  logo_url?: string;
  contact_name?: string;
  contact_phone?: string;
  created_at?: string;
}

export default function Events() {
  const { isAdmin } = useAuth();
  const { competitions = [] } = useData();

  const [activeTab, setActiveTab] = useState<'tasks' | 'sponsors'>('tasks');
  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter phase for tasks
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'pre-event' | 'event-day' | 'post-event'>('all');

  // Form Task State
  const initialTaskForm = {
    title: '',
    description: '',
    phase: 'pre-event' as 'pre-event' | 'event-day' | 'post-event',
    assigned_to: '',
    due_date: new Date().toISOString().slice(0, 10),
    priority: 'medium' as 'low' | 'medium' | 'high'
  };
  const [taskForm, setTaskForm] = useState(initialTaskForm);

  // Form Sponsor State
  const initialSponsorForm = {
    brand_name: '',
    tier: 'pendukung' as 'utama' | 'pendukung' | 'media',
    package_fee: '',
    contact_name: '',
    contact_phone: '',
    logo_url: ''
  };
  const [sponsorForm, setSponsorForm] = useState(initialSponsorForm);

  useEffect(() => {
    fetchEventData();
  }, [selectedCompId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      // Fetch Tasks
      let taskQuery = supabase.from('event_tasks').select('*').order('due_date', { ascending: true });
      if (selectedCompId !== 'all') {
        taskQuery = taskQuery.eq('competition_id', selectedCompId);
      }
      const { data: taskData } = await taskQuery;
      setTasks(taskData || []);

      // Fetch Sponsors
      let sponsorQuery = supabase.from('sponsors').select('*').order('created_at', { ascending: false });
      if (selectedCompId !== 'all') {
        sponsorQuery = sponsorQuery.eq('competition_id', selectedCompId);
      }
      const { data: sponsorData } = await sponsorQuery;
      setSponsors(sponsorData || []);
    } catch (err) {
      console.error('Error fetching event data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Task Handlers
  const handleSaveTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;

    try {
      setSaving(true);
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        phase: taskForm.phase,
        assigned_to: taskForm.assigned_to,
        due_date: taskForm.due_date || null,
        priority: taskForm.priority,
        status: 'todo',
        competition_id: selectedCompId !== 'all' ? selectedCompId : null
      };

      const { error } = await supabase.from('event_tasks').insert([payload]);
      if (error) throw error;

      setIsTaskModalOpen(false);
      setTaskForm(initialTaskForm);
      fetchEventData();
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Gagal menyimpan tugas kepanitiaan.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTaskStatus = async (task: EventTask) => {
    const nextStatusMap: Record<string, 'todo' | 'in-progress' | 'done'> = {
      'todo': 'in-progress',
      'in-progress': 'done',
      'done': 'todo'
    };
    const nextStatus = nextStatusMap[task.status];

    try {
      const { error } = await supabase
        .from('event_tasks')
        .update({ status: nextStatus })
        .eq('id', task.id);

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Hapus tugas ini?')) return;
    try {
      const { error } = await supabase.from('event_tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Sponsor Handlers
  const handleSaveSponsor = async (e: FormEvent) => {
    e.preventDefault();
    if (!sponsorForm.brand_name) return;

    try {
      setSaving(true);
      const payload = {
        brand_name: sponsorForm.brand_name,
        tier: sponsorForm.tier,
        package_fee: sponsorForm.package_fee ? parseInt(sponsorForm.package_fee) : 0,
        contact_name: sponsorForm.contact_name,
        contact_phone: sponsorForm.contact_phone,
        logo_url: sponsorForm.logo_url || null,
        competition_id: selectedCompId !== 'all' ? selectedCompId : null
      };

      const { error } = await supabase.from('sponsors').insert([payload]);
      if (error) throw error;

      setIsSponsorModalOpen(false);
      setSponsorForm(initialSponsorForm);
      fetchEventData();
    } catch (err) {
      console.error('Error saving sponsor:', err);
      alert('Gagal menyimpan data sponsor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm('Hapus sponsor ini?')) return;
    try {
      const { error } = await supabase.from('sponsors').delete().eq('id', id);
      if (error) throw error;
      setSponsors(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting sponsor:', err);
    }
  };

  // Calculations
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalSponsorshipFunds = sponsors.reduce((acc, curr) => acc + (curr.package_fee || 0), 0);

  const filteredTasks = tasks.filter(t => {
    if (phaseFilter === 'all') return true;
    return t.phase === phaseFilter;
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-green-950 via-slate-900 to-green-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-green-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-semibold mb-3">
              <CalendarRange size={14} /> Tournament & Event Project Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              Manajemen Event & Turnamen
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Pusat koordinasi tugas kepanitiaan futsal (Pre-event, Hari-H, Post-event) dan pencatatan sponsorship pendukung turnamen.
            </p>
          </div>

          {/* Competition Selector */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col gap-1.5">
            <span className="text-xs text-slate-300 font-semibold uppercase">Pilih Turnamen / Acara:</span>
            <select
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            >
              <option value="all">-- Semua Turnamen & Acara --</option>
              {competitions.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress & Quick Metrics */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-xs text-slate-300 font-medium">Progres Persiapan</div>
            <div className="text-2xl font-black text-yellow-400 mt-1">{progressPercent}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-yellow-400 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">{doneTasks} dari {totalTasks} tugas tuntas</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-xs text-slate-300 font-medium">Tugas Berjalan (In-Progress)</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{inProgressTasks}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Sedang dikerjakan panitia</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-xs text-slate-300 font-medium">Total Dana Sponsor</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{formatRupiah(totalSponsorshipFunds)}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Dari {sponsors.length} brand mitra</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-xs text-slate-300 font-medium">Status Kesiapan Hari-H</div>
            <div className="text-2xl font-black text-white mt-1">
              {progressPercent >= 80 ? 'Siap Tempur' : progressPercent >= 40 ? 'Persiapan' : 'Tahap Awal'}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Koordinasi panitia intensif</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-green-900 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <CheckCircle2 size={16} /> Checklist Panitia ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'sponsors'
                ? 'bg-green-900 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Building2 size={16} /> Manajemen Sponsor ({sponsors.length})
          </button>
        </div>

        {activeTab === 'tasks' ? (
          <button
            onClick={() => {
              setTaskForm(initialTaskForm);
              setIsTaskModalOpen(true);
            }}
            className="bg-green-900 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-800 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Tambah Tugas
          </button>
        ) : (
          <button
            onClick={() => {
              setSponsorForm(initialSponsorForm);
              setIsSponsorModalOpen(true);
            }}
            className="bg-green-900 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-800 transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Tambah Sponsor
          </button>
        )}
      </div>

      {/* TAB 1: CHECKLIST PANITIA */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Phase Filter Tabs */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl max-w-fit">
            <button
              onClick={() => setPhaseFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                phaseFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Fase
            </button>
            <button
              onClick={() => setPhaseFilter('pre-event')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                phaseFilter === 'pre-event' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              1. Pre-Event (Persiapan)
            </button>
            <button
              onClick={() => setPhaseFilter('event-day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                phaseFilter === 'event-day' ? 'bg-white text-yellow-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              2. Hari-H (Pelaksanaan)
            </button>
            <button
              onClick={() => setPhaseFilter('post-event')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                phaseFilter === 'post-event' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              3. Post-Event (Evaluasi & LPJ)
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Memuat tugas kepanitiaan...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-700">Belum ada tugas di fase ini</p>
              <p className="text-xs text-gray-400 mt-1">Klik tombol "+ Tambah Tugas" untuk membagi checklist panitia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map(task => {
                const priorityColors = {
                  high: 'bg-rose-100 text-rose-800 border-rose-200',
                  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  low: 'bg-blue-100 text-blue-800 border-blue-200'
                };

                const phaseLabels = {
                  'pre-event': 'Pre-Event (Persiapan)',
                  'event-day': 'Hari-H (Match Day)',
                  'post-event': 'Post-Event (LPJ)'
                };

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm transition flex flex-col justify-between ${
                      task.status === 'done'
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : task.status === 'in-progress'
                        ? 'border-blue-200'
                        : 'border-gray-200'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                          {phaseLabels[task.phase]}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                          Prioritas {task.priority}
                        </span>
                      </div>

                      {/* Task Title */}
                      <h4 className={`text-base font-bold text-gray-900 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                        {task.assigned_to && (
                          <div className="flex items-center gap-1.5">
                            <User size={13} className="text-green-800" />
                            <span>PIC: <strong className="text-gray-800">{task.assigned_to}</strong></span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-amber-600" />
                            <span>Tenggat: {task.due_date}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                      {/* Status Toggle Button */}
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                          task.status === 'done'
                            ? 'bg-emerald-600 text-white'
                            : task.status === 'in-progress'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title="Klik untuk ubah status"
                      >
                        {task.status === 'done' ? (
                          <>
                            <CheckCircle2 size={14} /> Selesai
                          </>
                        ) : task.status === 'in-progress' ? (
                          <>
                            <Clock size={14} /> Berjalan
                          </>
                        ) : (
                          <>
                            <Circle size={14} /> Menunggu
                          </>
                        )}
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-400 hover:text-rose-600 p-1 transition"
                          title="Hapus Tugas"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAJEMEN SPONSOR */}
      {activeTab === 'sponsors' && (
        <div className="space-y-6">
          {/* Sponsors Grid by Tier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sponsor Utama */}
            <div className="bg-white rounded-3xl border border-yellow-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-yellow-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">Sponsor Utama (Gold)</h3>
                      <p className="text-[11px] text-gray-500">Logo di jersey, piala & banner tengah</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {sponsors.filter(s => s.tier === 'utama').map(sp => (
                    <div key={sp.id} className="p-3.5 bg-yellow-50/60 rounded-2xl border border-yellow-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{sp.brand_name}</div>
                        <div className="text-xs font-extrabold text-yellow-800 mt-0.5">{formatRupiah(sp.package_fee || 0)}</div>
                        {sp.contact_name && <div className="text-[11px] text-gray-500">PIC: {sp.contact_name}</div>}
                      </div>
                      <div className="flex items-center gap-1">
                        {sp.contact_phone && (
                          <a
                            href={`https://wa.me/${sp.contact_phone.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(sp.contact_name || sp.brand_name)},%20terkait%20sponsorship%20Eagle%20Futsal.`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleDeleteSponsor(sp.id)} className="p-1.5 text-gray-400 hover:text-rose-600 transition">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {sponsors.filter(s => s.tier === 'utama').length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">Belum ada sponsor utama</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sponsor Pendukung */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥈</span>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">Sponsor Pendukung (Silver)</h3>
                      <p className="text-[11px] text-gray-500">Banner samping lapangan & booth venue</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {sponsors.filter(s => s.tier === 'pendukung').map(sp => (
                    <div key={sp.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{sp.brand_name}</div>
                        <div className="text-xs font-extrabold text-green-700 mt-0.5">{formatRupiah(sp.package_fee || 0)}</div>
                        {sp.contact_name && <div className="text-[11px] text-gray-500">PIC: {sp.contact_name}</div>}
                      </div>
                      <div className="flex items-center gap-1">
                        {sp.contact_phone && (
                          <a
                            href={`https://wa.me/${sp.contact_phone.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(sp.contact_name || sp.brand_name)},%20terkait%20sponsorship%20Eagle%20Futsal.`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleDeleteSponsor(sp.id)} className="p-1.5 text-gray-400 hover:text-rose-600 transition">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {sponsors.filter(s => s.tier === 'pendukung').length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">Belum ada sponsor pendukung</div>
                  )}
                </div>
              </div>
            </div>

            {/* Media Partner */}
            <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-blue-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎙️</span>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">Media Partner & Publikasi</h3>
                      <p className="text-[11px] text-gray-500">Liputan media, live-stream, & sosmed</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {sponsors.filter(s => s.tier === 'media').map(sp => (
                    <div key={sp.id} className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{sp.brand_name}</div>
                        <div className="text-xs font-semibold text-blue-700 mt-0.5">Media Coverage</div>
                        {sp.contact_name && <div className="text-[11px] text-gray-500">PIC: {sp.contact_name}</div>}
                      </div>
                      <div className="flex items-center gap-1">
                        {sp.contact_phone && (
                          <a
                            href={`https://wa.me/${sp.contact_phone.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(sp.contact_name || sp.brand_name)},%20terkait%20media%20partner%20Eagle%20Futsal.`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleDeleteSponsor(sp.id)} className="p-1.5 text-gray-400 hover:text-rose-600 transition">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {sponsors.filter(s => s.tier === 'media').length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">Belum ada media partner</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH TUGAS */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-base">Tambah Tugas Kepanitiaan</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Nama Tugas / Pekerjaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cetak banner lapangan & nomor punggung"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Fase Acara
                  </label>
                  <select
                    value={taskForm.phase}
                    onChange={(e) => setTaskForm({ ...taskForm, phase: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                  >
                    <option value="pre-event">1. Pre-Event (Persiapan)</option>
                    <option value="event-day">2. Hari-H (Pelaksanaan)</option>
                    <option value="post-event">3. Post-Event (LPJ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                  >
                    <option value="high">Tinggi (Mendesak)</option>
                    <option value="medium">Sedang</option>
                    <option value="low">Rendah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Petugas / PIC
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Coach Dedi"
                    value={taskForm.assigned_to}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Tenggat Waktu
                  </label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan rincian tugas..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm bg-green-900 text-white rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Tugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SPONSOR */}
      {isSponsorModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-base">Tambah Sponsor Turnamen</h3>
              <button onClick={() => setIsSponsorModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSponsor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Nama Brand / Perusahaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Specs Indonesia"
                  value={sponsorForm.brand_name}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, brand_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Kategori Tier
                  </label>
                  <select
                    value={sponsorForm.tier}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                  >
                    <option value="utama">Sponsor Utama (Gold)</option>
                    <option value="pendukung">Sponsor Pendukung (Silver)</option>
                    <option value="media">Media Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Nilai Paket (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 5000000"
                    value={sponsorForm.package_fee}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, package_fee: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Nama Kontak PIC
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ibu Rina"
                    value={sponsorForm.contact_name}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, contact_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    No. WhatsApp PIC
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    value={sponsorForm.contact_phone}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, contact_phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSponsorModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm bg-green-900 text-white rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
