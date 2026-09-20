import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { Search, Plus, Edit2, UserX, UserCheck, X, FileText, User } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  full_name: string;
  dob: string;
  age_cohort: string;
  parent_name: string;
  parent_phone: string;
  jersey_size: string;
  jersey_number?: number;
  medical_notes: string;
  status: 'active' | 'inactive';
  photo_url?: string;
  doc_akte?: string;
  doc_kk?: string;
  doc_raport?: string;
  doc_kia?: string;
}

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  
  const initialFormState = {
    name: '',
    fullName: '',
    dob: '',
    ageCohort: 'U-8',
    parentName: '',
    parentPhone: '',
    jerseySize: 'S',
    jerseyNumber: '' as string | number,
    medicalNotes: '',
    status: 'active' as 'active' | 'inactive',
    photoUrl: '',
    docAkte: '',
    docKk: '',
    docRaport: '',
    docKia: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const studentData = {
        id: editingStudent?.id || undefined,
        name: formData.name,
        full_name: formData.fullName,
        dob: formData.dob,
        age_cohort: formData.ageCohort,
        parent_name: formData.parentName,
        parent_phone: formData.parentPhone,
        medical_notes: formData.medicalNotes,
        jersey_size: formData.jerseySize,
        jersey_number: formData.jerseyNumber ? parseInt(formData.jerseyNumber.toString()) : null,
        status: formData.status,
        photo_url: formData.photoUrl || null,
        doc_akte: formData.docAkte || null,
        doc_kk: formData.docKk || null,
        doc_raport: formData.docRaport || null,
        doc_kia: formData.docKia || null,
      };

      const { error } = await supabase.from('students').upsert(studentData);
      if (error) throw error;

      setIsModalOpen(false);
      setEditingStudent(null);
      setFormData(initialFormState);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Gagal menyimpan data siswa');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (student: Student) => {
    try {
      const newStatus = student.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', student.id);
        
      if (error) throw error;
      fetchStudents();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      fullName: student.full_name || '',
      dob: student.dob || '',
      ageCohort: student.age_cohort || 'U-8',
      parentName: student.parent_name || '',
      parentPhone: student.parent_phone || '',
      jerseySize: student.jersey_size || 'S',
      jerseyNumber: student.jersey_number ?? '',
      medicalNotes: student.medical_notes || '',
      status: student.status || 'active',
      photoUrl: student.photo_url || '',
      docAkte: student.doc_akte || '',
      docKk: student.doc_kk || '',
      docRaport: student.doc_raport || '',
      docKia: student.doc_kia || ''
    });
    setIsModalOpen(true);
  };

  const activeStudents = students.filter(s => s.status === 'active');
  const cohortStats = {
    'U-5': activeStudents.filter(s => s.age_cohort === 'U-5').length,
    'U-8': activeStudents.filter(s => s.age_cohort === 'U-8').length,
    'U-12': activeStudents.filter(s => s.age_cohort === 'U-12').length,
    'U-15': activeStudents.filter(s => s.age_cohort === 'U-15').length,
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.full_name && s.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-900">Daftar Siswa</h1>
        {user && (
          <button 
            onClick={() => {
              setEditingStudent(null);
              setFormData(initialFormState);
              setIsModalOpen(true);
            }}
            className="bg-green-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-800"
          >
            <Plus size={20} />
            Tambah Siswa
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm">Total Aktif</span>
          <span className="text-2xl font-bold text-green-900">{activeStudents.length}</span>
        </div>
        {Object.entries(cohortStats).map(([cohort, count]) => (
          <div key={cohort} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <span className="text-gray-500 text-sm">{cohort}</span>
            <span className="text-2xl font-bold text-yellow-600">{count}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Cari siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <UserX size={48} className="text-gray-300 mb-2" />
            <p>Tidak ada data siswa ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Nama</th>
                  <th className="px-6 py-3 font-medium">Cohort</th>
                  <th className="px-6 py-3 font-medium">Ortu</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div 
                        className="font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => setSelectedStudent(student)}
                      >
                        {student.name}
                      </div>
                      <div className="text-xs text-gray-500">{student.full_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-yellow-100 text-yellow-800 py-1 px-2 rounded text-xs font-medium">
                        {student.age_cohort}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{student.parent_name}</div>
                      <div className="text-xs text-gray-500">{student.parent_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`py-1 px-2 rounded-full text-xs font-medium ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status === 'active' ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(student)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(student)}
                        className={`p-1.5 rounded ${
                          student.status === 'active' 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={student.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}
                      >
                        {student.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-green-900">
                {editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Biodata Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Biodata Siswa</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      required
                      value={formData.dob}
                      onChange={e => setFormData({...formData, dob: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelompok Umur (Cohort)</label>
                    <select
                      value={formData.ageCohort}
                      onChange={e => setFormData({...formData, ageCohort: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="U-5">U-5</option>
                      <option value="U-8">U-8</option>
                      <option value="U-12">U-12</option>
                      <option value="U-15">U-15</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Orang Tua</label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={e => setFormData({...formData, parentName: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. HP Orang Tua</label>
                    <input
                      type="tel"
                      required
                      value={formData.parentPhone}
                      onChange={e => setFormData({...formData, parentPhone: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran Jersey</label>
                      <select
                        value={formData.jerseySize}
                        onChange={e => setFormData({...formData, jerseySize: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">No. Punggung</label>
                      <input
                        type="number"
                        placeholder="Contoh: 10"
                        value={formData.jerseyNumber}
                        onChange={e => setFormData({...formData, jerseyNumber: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Non-aktif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Medis (Opsional)</label>
                    <textarea
                      value={formData.medicalNotes}
                      onChange={e => setFormData({...formData, medicalNotes: e.target.value})}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                      placeholder="Riwayat penyakit, alergi, dll."
                    />
                  </div>
                </div>

                {/* Documents Section (Google Drive URLs) */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b pb-2">Dokumen Siswa (URL Google Drive)</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Foto Siswa</label>
                    <input
                      type="url"
                      value={formData.photoUrl}
                      onChange={e => setFormData({...formData, photoUrl: e.target.value})}
                      placeholder="https://drive.google.com/..."
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Akte Kelahiran</label>
                    <input
                      type="url"
                      value={formData.docAkte}
                      onChange={e => setFormData({...formData, docAkte: e.target.value})}
                      placeholder="https://drive.google.com/..."
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Kartu Keluarga (KK)</label>
                    <input
                      type="url"
                      value={formData.docKk}
                      onChange={e => setFormData({...formData, docKk: e.target.value})}
                      placeholder="https://drive.google.com/..."
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Raport Terakhir</label>
                    <input
                      type="url"
                      value={formData.docRaport}
                      onChange={e => setFormData({...formData, docRaport: e.target.value})}
                      placeholder="https://drive.google.com/..."
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link KIA (Kartu Identitas Anak)</label>
                    <input
                      type="url"
                      value={formData.docKia}
                      onChange={e => setFormData({...formData, docKia: e.target.value})}
                      placeholder="https://drive.google.com/..."
                      className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Profil & Dokumen Siswa</h2>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-shrink-0 flex justify-center">
                  {selectedStudent.photo_url ? (
                    <img 
                      src={selectedStudent.photo_url} 
                      alt={`Foto ${selectedStudent.name}`} 
                      className="w-32 h-32 object-cover rounded-xl border-4 border-gray-100 shadow-sm"
                      onError={(e) => {
                        // Fallback if URL is a Google Drive link that isn't directly displayable as an image
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center border-4 border-gray-50 text-gray-400 ${selectedStudent.photo_url ? 'hidden' : ''}`}>
                    <User size={48} />
                  </div>
                </div>
                
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                  <div>
                    <span className="text-sm text-gray-500 block">Nama Lengkap</span>
                    <span className="font-semibold text-gray-900">{selectedStudent.full_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Nama Panggilan</span>
                    <span className="font-semibold text-gray-900">{selectedStudent.name}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Tanggal Lahir</span>
                    <span className="font-medium text-gray-900">{selectedStudent.dob || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Kelompok Umur</span>
                    <span className="inline-block mt-1 bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded text-xs font-medium">
                      {selectedStudent.age_cohort}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Orang Tua</span>
                    <span className="font-medium text-gray-900">{selectedStudent.parent_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Kontak Ortu</span>
                    <span className="font-medium text-gray-900">{selectedStudent.parent_phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Jersey</span>
                    <span className="font-medium text-gray-900">
                      {[
                        selectedStudent.jersey_size ? `Ukuran: ${selectedStudent.jersey_size}` : null,
                        selectedStudent.jersey_number !== undefined && selectedStudent.jersey_number !== null ? `No: ${selectedStudent.jersey_number}` : null
                      ].filter(Boolean).join(' | ') || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Status</span>
                    <span className={`inline-block mt-1 py-0.5 px-2 rounded-full text-xs font-medium ${
                      selectedStudent.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedStudent.status === 'active' ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-sm text-gray-500 block">Catatan Medis</span>
                    <span className="font-medium text-gray-900">{selectedStudent.medical_notes || '-'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" /> 
                  Dokumen Kelengkapan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: 'Akte Kelahiran', url: selectedStudent.doc_akte },
                    { title: 'Kartu Keluarga', url: selectedStudent.doc_kk },
                    { title: 'Raport', url: selectedStudent.doc_raport },
                    { title: 'KIA', url: selectedStudent.doc_kia },
                  ].map((doc, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-between">
                      <span className="font-medium text-gray-800 text-sm mb-2">{doc.title}</span>
                      {doc.url ? (
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-center w-full py-1.5 px-3 bg-white border border-gray-300 rounded text-xs text-blue-600 font-medium hover:bg-gray-50 transition-colors"
                        >
                          Buka Dokumen (Google Drive)
                        </a>
                      ) : (
                        <span className="text-center w-full py-1.5 text-xs text-gray-400 italic">
                          Belum ada dokumen
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
