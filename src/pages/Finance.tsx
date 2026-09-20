import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Calendar, 
  Tag, 
  CreditCard, 
  X, 
  Trash2,
  Filter,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

interface FinanceRecord {
  id: string;
  date: string;
  category: 'income' | 'expense';
  type: string;
  description: string;
  amount: number;
  source?: string;
  created_at?: string;
}

export default function Finance() {
  const { isAdmin } = useAuth();
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    date: new Date().toISOString().slice(0, 10),
    category: 'expense' as 'income' | 'expense',
    type: 'Sewa Lapangan',
    description: '',
    amount: '',
    source: 'Transfer Bank'
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching finances:', error);
      } else {
        setFinances(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Mohon masukkan nominal yang valid.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        date: formData.date,
        category: formData.category,
        type: formData.type,
        description: formData.description || formData.type,
        amount: parseInt(formData.amount),
        source: formData.source
      };

      const { error } = await supabase.from('finances').insert([payload]);
      if (error) throw error;

      setIsModalOpen(false);
      setFormData(initialForm);
      fetchFinances();
    } catch (err) {
      console.error('Error saving finance record:', err);
      alert('Gagal menyimpan transaksi. Pastikan Anda sudah login atau memiliki izin.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan transaksi ini?')) return;
    try {
      const { error } = await supabase.from('finances').delete().eq('id', id);
      if (error) throw error;
      fetchFinances();
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Gagal menghapus catatan transaksi.');
    }
  };

  // Filtered list
  const filteredFinances = finances.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesMonth = selectedMonth ? item.date.startsWith(selectedMonth) : true;
    return matchesCategory && matchesMonth;
  });

  // Calculate totals
  const totalIncome = finances
    .filter(f => f.category === 'income')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalExpense = finances
    .filter(f => f.category === 'expense')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // Month-specific totals
  const monthIncome = finances
    .filter(f => f.category === 'income' && f.date.startsWith(selectedMonth))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const monthExpense = finances
    .filter(f => f.category === 'expense' && f.date.startsWith(selectedMonth))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="text-green-700 w-8 h-8" />
            Dashboard Keuangan & Kas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pencatatan arus kas operasional, sewa lapangan, gaji pelatih, dan pemasukan akademi
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(initialForm);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-green-900 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-green-800 transition"
        >
          <Plus size={18} />
          Catat Transaksi
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Saldo */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className={`p-4 rounded-xl ${netBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <Wallet size={28} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Saldo Kas</div>
            <div className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-green-800' : 'text-red-600'}`}>
              {formatRupiah(netBalance)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Kumulatif seluruh waktu</div>
          </div>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-100 text-emerald-700">
            <TrendingUp size={28} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pemasukan ({selectedMonth})</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatRupiah(monthIncome)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Total Semua: {formatRupiah(totalIncome)}</div>
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 rounded-xl bg-rose-100 text-rose-700">
            <TrendingDown size={28} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pengeluaran ({selectedMonth})</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {formatRupiah(monthExpense)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Total Semua: {formatRupiah(totalExpense)}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${
              filterCategory === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua Transaksi
          </button>
          <button
            onClick={() => setFilterCategory('income')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition flex items-center gap-1.5 ${
              filterCategory === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowDownLeft size={14} />
            Pemasukan
          </button>
          <button
            onClick={() => setFilterCategory('expense')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition flex items-center gap-1.5 ${
              filterCategory === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowUpRight size={14} />
            Pengeluaran
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Bulan:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth('')}
              className="text-xs text-blue-600 hover:underline"
            >
              Semua Waktu
            </button>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat catatan keuangan...</div>
        ) : filteredFinances.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="font-medium">Belum ada transaksi di periode ini</p>
            <p className="text-xs text-gray-400 mt-1">Klik tombol "Catat Transaksi" untuk menambahkan data baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3.5 px-4 font-semibold">Tanggal</th>
                  <th className="py-3.5 px-4 font-semibold">Kategori & Tipe</th>
                  <th className="py-3.5 px-4 font-semibold">Deskripsi</th>
                  <th className="py-3.5 px-4 font-semibold">Sumber Dana</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Nominal</th>
                  {isAdmin && <th className="py-3.5 px-4 font-semibold text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredFinances.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.category === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.category === 'income' ? 'Masuk' : 'Keluar'}
                        </span>
                        <span className="font-medium text-gray-800">{item.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {item.source || '-'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        item.category === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {item.category === 'income' ? '+' : '-'} {formatRupiah(item.amount)}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-600 p-1 transition"
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">Catat Transaksi Keuangan</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Kategori: Pemasukan / Pengeluaran */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'expense', type: 'Sewa Lapangan' })}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                      formData.category === 'expense'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'income', type: 'Pendaftaran Siswa' })}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                      formData.category === 'income'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              {/* Tipe / Pos Anggaran */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Pos Anggaran / Tipe
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                  {formData.category === 'expense' ? (
                    <>
                      <option value="Sewa Lapangan">Sewa Lapangan</option>
                      <option value="Honor Pelatih">Honor Pelatih</option>
                      <option value="Peralatan / Bola / Cone">Peralatan / Bola / Cone</option>
                      <option value="Konsumsi & Medis">Konsumsi & Medis</option>
                      <option value="Pendaftaran Turnamen">Pendaftaran Turnamen</option>
                      <option value="Operasional Kantor">Operasional Kantor</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Pendaftaran Siswa">Pendaftaran Siswa Baru</option>
                      <option value="Pembayaran SPP">Pembayaran SPP</option>
                      <option value="Penjualan Jersey">Penjualan Jersey / Kit</option>
                      <option value="Sponsorship">Sponsorship</option>
                      <option value="Donasi / Subsidi">Donasi / Subsidi</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Nominal (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">Rp</span>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 250000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tanggal & Metode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1">
                    <Calendar size={12} /> Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1">
                    <CreditCard size={12} /> Metode / Rekening
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  >
                    <option value="Kas / Tunai">Kas / Tunai</option>
                    <option value="Transfer Bank BCA">Transfer BCA</option>
                    <option value="Transfer Bank Lain">Transfer Bank Lain</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1">
                  <Tag size={12} /> Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Sewa lapangan 2 jam di Lapangan Bintang"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm bg-green-900 text-white rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
