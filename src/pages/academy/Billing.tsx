import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Settings, Receipt, Printer, Trash, X, Save, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InvoiceSetting {
  id: number;
  academy_name: string;
  academy_address: string;
  academy_phone: string;
  bank_name: string;
  bank_account: string;
  bank_account_name: string;
  invoice_prefix: string;
  invoice_notes: string;
}

interface Transaction {
  id: string;
  student_id: string;
  type: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  paid_date?: string;
  invoice_number?: string;
  items?: any[];
  subtotal?: number;
  discount?: number;
  total_amount?: number;
  students?: {
    name: string;
  };
}

export default function Billing() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'settings'>('invoices');
  
  // Settings State
  const [settings, setSettings] = useState<InvoiceSetting>({
    id: 1,
    academy_name: '',
    academy_address: '',
    academy_phone: '',
    bank_name: '',
    bank_account: '',
    bank_account_name: '',
    invoice_prefix: 'INV-',
    invoice_notes: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Invoices State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState<{id: string, name: string}[]>([]);
  
  // New Invoice State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState([{ description: '', amount: 0 }]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchSettings();
    fetchTransactions();
    fetchStudents();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('invoice_settings')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('invoice_settings')
        .upsert({ ...settings, id: 1 });
      if (error) throw error;
      alert('Pengaturan invoice berhasil disimpan');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          students ( name )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const today = new Date().toISOString().split('T')[0];
      const processedData = (data || []).map((t: any) => {
        if (t.status === 'pending' && t.due_date < today) {
          return { ...t, status: 'overdue' as const };
        }
        return t;
      });
      
      setTransactions(processedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('id, name')
        .eq('status', 'active');
      if (data) setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', amount: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated);
  };

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalAmount = subtotal - discount;

  const generateInvoiceNumber = () => {
    const prefix = settings.invoice_prefix || 'INV-';
    const dateStr = invoiceDate.replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${dateStr}-${randomSuffix}`;
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Pilih siswa terlebih dahulu');
      return;
    }
    if (lineItems.length === 0 || lineItems.some(i => !i.description || i.amount <= 0)) {
      alert('Isi detail item dengan benar');
      return;
    }

    try {
      const invNumber = generateInvoiceNumber();
      const newInvoice = {
        student_id: selectedStudent,
        type: 'Other',
        amount: totalAmount, // legacy support
        status: 'pending',
        due_date: dueDate,
        invoice_number: invNumber,
        items: lineItems,
        subtotal: subtotal,
        discount: discount,
        total_amount: totalAmount
      };

      const { error } = await supabase.from('transactions').insert([newInvoice]);
      if (error) throw error;
      
      setIsModalOpen(false);
      resetModal();
      fetchTransactions();
      alert('Invoice berhasil dibuat!');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Gagal membuat invoice');
    }
  };

  const resetModal = () => {
    setSelectedStudent('');
    setLineItems([{ description: '', amount: 0 }]);
    setDiscount(0);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date().toISOString().split('T')[0]);
  };

  const formatRp = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <div className="p-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Receipt className="text-green-600" />
          Invoice Dashboard
        </h1>
        {activeTab === 'invoices' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={18} />
            Buat Invoice
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-6 py-3 font-medium text-sm outline-none transition-colors border-b-2 ${
            activeTab === 'invoices'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('invoices')}
        >
          <div className="flex items-center gap-2">
            <FileText size={16} /> Daftar Invoice
          </div>
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm outline-none transition-colors border-b-2 ${
            activeTab === 'settings'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} /> Pengaturan Invoice
          </div>
        </button>
      </div>

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Memuat data invoice...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Tidak ada data invoice.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">No. Invoice</th>
                    <th className="px-6 py-4 font-medium">Siswa</th>
                    <th className="px-6 py-4 font-medium">Total</th>
                    <th className="px-6 py-4 font-medium">Jatuh Tempo</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-green-700">
                        {t.invoice_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        {t.students?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatRp(t.total_amount || t.amount || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(t.due_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        {t.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 size={12} /> Lunas
                          </span>
                        )}
                        {t.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {t.status === 'overdue' && (
                          <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle size={12} /> Menunggak
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/academy/invoice/print/${t.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm transition-colors"
                        >
                          <Printer size={14} /> Cetak
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <form onSubmit={saveSettings} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2">Informasi Akademi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Akademi</label>
              <input
                type="text"
                value={settings.academy_name}
                onChange={e => setSettings({...settings, academy_name: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Eagle Futsal Academy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
              <input
                type="text"
                value={settings.academy_phone}
                onChange={e => setSettings({...settings, academy_phone: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Akademi</label>
              <textarea
                value={settings.academy_address}
                onChange={e => setSettings({...settings, academy_address: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2">Informasi Pembayaran (Bank)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
              <input
                type="text"
                value={settings.bank_name}
                onChange={e => setSettings({...settings, bank_name: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder="BCA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                value={settings.bank_account}
                onChange={e => setSettings({...settings, bank_account: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
              <input
                type="text"
                value={settings.bank_account_name}
                onChange={e => setSettings({...settings, bank_account_name: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-6 text-gray-800 border-b pb-2">Preferensi Invoice</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefix Invoice</label>
              <input
                type="text"
                value={settings.invoice_prefix}
                onChange={e => setSettings({...settings, invoice_prefix: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                placeholder="INV-"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan (Footer)</label>
              <textarea
                value={settings.invoice_notes}
                onChange={e => setSettings({...settings, invoice_notes: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Terima kasih atas pembayaran Anda..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      )}

      {/* CREATE INVOICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-gray-50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Buat Invoice Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="invoice-form" onSubmit={handleCreateInvoice}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 bg-white p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Siswa</label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      required
                      className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Invoice</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      required
                      className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 font-medium text-sm text-gray-700">Deskripsi Item</th>
                        <th className="px-4 py-3 font-medium text-sm text-gray-700 w-48">Jumlah (Rp)</th>
                        <th className="px-4 py-3 font-medium text-sm text-gray-700 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              placeholder="Cth: SPP Bulan Agustus"
                              className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-green-500"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.amount || ''}
                              onChange={(e) => handleLineItemChange(index, 'amount', Number(e.target.value))}
                              placeholder="0"
                              className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-green-500"
                              required
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                              disabled={lineItems.length === 1}
                            >
                              <Trash size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                    >
                      <Plus size={16} /> Tambah Baris
                    </button>
                  </div>
                </div>

                <div className="flex justify-end bg-white p-4 rounded-lg border border-gray-200">
                  <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>{formatRp(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Diskon:</span>
                      <div className="flex items-center">
                        <span className="mr-2">Rp</span>
                        <input
                          type="number"
                          value={discount || ''}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="w-24 p-1.5 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-green-500 text-right"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-800">
                      <span>Total:</span>
                      <span className="text-green-700">{formatRp(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="invoice-form"
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <Save size={18} /> Simpan Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
