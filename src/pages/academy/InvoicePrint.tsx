import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, Clock } from 'lucide-react';
import type { InvoiceSetting } from '../../types';

interface InvoiceItem {
  description: string;
  amount: number;
}

interface Transaction {
  id: string;
  invoice_number?: string;
  student_id: string;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  created_at?: string;
  items?: InvoiceItem[];
  amount?: number;
  subtotal?: number;
  discount?: number;
  total_amount?: number;
}

interface Student {
  id: string;
  name: string;
  age_cohort?: string;
  cohort?: string;
  parent_name?: string;
}

export default function InvoicePrint() {
  const { id } = useParams<{ id: string }>();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [settings, setSettings] = useState<InvoiceSetting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      try {
        setLoading(true);
        // Fetch transaction
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', id)
          .single();
          
        if (txError) throw txError;
        setTransaction(txData);
        
        // Fetch student
        if (txData.student_id) {
          const { data: studentData, error: stError } = await supabase
            .from('students')
            .select('*')
            .eq('id', txData.student_id)
            .single();
            
          if (!stError) setStudent(studentData);
        }
        
        // Fetch settings
        const { data: settingData, error: setError } = await supabase
          .from('invoice_settings')
          .select('*')
          .eq('id', 1)
          .single();
          
        if (!setError && settingData) {
          setSettings(settingData);
        } else {
          // fallback
          setSettings({
            id: 1,
            academy_name: 'Eagle Futsal Academy',
            academy_address: 'Jl. Lapangan Futsal No.1',
            academy_phone: '0812-xxxx-xxxx',
            bank_name: 'BCA',
            bank_account: '1234567890',
            bank_account_name: 'Eagle Futsal',
            invoice_prefix: 'INV',
            invoice_notes: 'Harap selesaikan pembayaran.'
          });
        }
      } catch (error) {
        console.error("Error fetching invoice data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-slate-50"><p>Memuat invoice...</p></div>;
  }

  if (!transaction) {
    return <div className="flex justify-center items-center h-screen bg-slate-50"><p>Invoice tidak ditemukan.</p></div>;
  }

  // Use transaction.items if available, fallback to single item using amount
  const items: InvoiceItem[] = transaction.items && transaction.items.length > 0 
    ? transaction.items 
    : [{ description: 'Biaya Futsal', amount: transaction.amount || 0 }];
    
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const discount = 0; // Not implemented in base schema yet
  const total = subtotal - discount;
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <>
      <style>
        {`
          @page { size: A4 portrait; margin: 0; }
          @media print {
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}
      </style>
      <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white flex flex-col items-center">
        
        <div className="w-full max-w-4xl flex justify-end mb-4 print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow transition-colors"
          >
            Cetak Invoice
          </button>
        </div>

        <div className="w-full max-w-4xl bg-white shadow-xl print:shadow-none p-10 md:p-14 min-h-[297mm]">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
            <div className="flex gap-4 items-center">
              <img src="/eagle logo.jpeg" alt="Academy Logo" className="h-20 w-20 object-contain rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">EAGLE FUTSAL ACADEMY</h1>
                <p className="text-sm text-slate-500 whitespace-pre-line mt-1">
                  {settings?.academy_address}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-4xl font-light text-slate-400 mb-2">INVOICE</h2>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-slate-500 font-medium">No. Invoice</span>
                  <span className="font-semibold text-slate-800">{transaction.invoice_number || transaction.id.slice(0,8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-slate-500 font-medium">Tanggal</span>
                  <span className="font-semibold text-slate-800">{formatDate(transaction.created_at || new Date().toISOString())}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-slate-500 font-medium">Jatuh Tempo</span>
                  <span className="font-semibold text-slate-800">{formatDate(transaction.due_date)}</span>
                </div>
                
                <div className="flex justify-end mt-2">
                  {transaction.status === 'paid' ? (
                    <span className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> LUNAS
                    </span>
                  ) : transaction.status === 'overdue' ? (
                    <span className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                      <Clock className="w-4 h-4 mr-1" /> TERLAMBAT
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                      <Clock className="w-4 h-4 mr-1" /> MENUNGGU PEMBAYARAN
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Ditagihkan Kepada:</h3>
            <div className="text-slate-800">
              <p className="font-bold text-lg">{student?.name || 'Siswa Tidak Diketahui'}</p>
              <p className="text-slate-600">{student?.cohort ? `Kelompok Usia: ${student.cohort}` : '-'}</p>
              {student?.parent_name && <p className="text-slate-600">Orang Tua: {student.parent_name}</p>}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left mb-8 border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm">
                <th className="py-3 px-4 font-semibold border-y border-slate-200 w-16 text-center">No</th>
                <th className="py-3 px-4 font-semibold border-y border-slate-200">Deskripsi</th>
                <th className="py-3 px-4 font-semibold border-y border-slate-200 text-right w-48">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="py-4 px-4 text-center text-slate-600">{index + 1}</td>
                  <td className="py-4 px-4 font-medium text-slate-800">{item.description}</td>
                  <td className="py-4 px-4 text-right text-slate-800">{formatCurrency(Number(item.amount) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="flex justify-end mb-12">
            <div className="w-1/2 md:w-1/3">
              <div className="flex justify-between py-2 text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between py-2 text-slate-600">
                <span>Diskon</span>
                <span className="font-medium">{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-slate-800 mt-2 text-lg font-bold text-slate-800">
                <span>Total Tagihan</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="border-t border-slate-200 pt-6">
            {settings?.bank_account && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800">Informasi Pembayaran:</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {settings.bank_name} - {settings.bank_account} ({settings.bank_account_name})
                </p>
              </div>
            )}
            
            {settings?.invoice_notes && (
              <div>
                <h4 className="text-sm font-bold text-slate-800">Catatan Tambahan:</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line">{settings.invoice_notes}</p>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-400 mt-16 pb-4">
            <p>Invoice ini sah dan diproses oleh sistem. Tidak memerlukan tanda tangan basah.</p>
          </div>

        </div>
      </div>
    </>
  );
}
