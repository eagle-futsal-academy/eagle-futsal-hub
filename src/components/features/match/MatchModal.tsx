import { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/SupabaseAuthContext';

export default function MatchModal({ match, onClose }: { match?: any, onClose: () => void }) {
  const { competitions } = useData();
  const { isAdmin } = useAuth();
  
  const isEditing = !!match;
  
  const [formData, setFormData] = useState({
    id: match?.id || undefined,
    competitionId: match?.competition_id || match?.competitionId || '',
    stage: match?.stage || '',
    matchType: match?.matchType || 'Group',
    homeTeam: match?.home_team || match?.homeTeam || '',
    awayTeam: match?.away_team || match?.awayTeam || '',
    date: match?.date || '',
    time: match?.time || '',
    venue: match?.venue || '',
    status: match?.status || 'Belum Main',
    scoreHome: match?.score_home ?? match?.scoreHome ?? 0,
    scoreAway: match?.score_away ?? match?.scoreAway ?? 0,
    penaltyHome: match?.penalty_home ?? match?.penaltyHome ?? 0,
    penaltyAway: match?.penalty_away ?? match?.penaltyAway ?? 0,
    woLoser: match?.wo_loser || match?.woLoser || '',
    evaluation: match?.evaluation || '',
    preMatchNotes: match?.pre_match_notes || match?.preMatchNotes || '',
    lineup: match?.lineup || [],
    goals: match?.goals || [],
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('matches').upsert({
        id: formData.id,
        competition_id: formData.competitionId,
        home_team: formData.homeTeam,
        away_team: formData.awayTeam,
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        status: formData.status,
        score_home: formData.scoreHome,
        score_away: formData.scoreAway,
        penalty_home: formData.penaltyHome,
        penalty_away: formData.penaltyAway,
        wo_loser: formData.woLoser,
        lineup: formData.lineup,
        goals: formData.goals,
        evaluation: formData.evaluation,
        pre_match_notes: formData.preMatchNotes,
        stage: formData.stage,
        match_type: formData.matchType,
      });

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Gagal menyimpan pertandingan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !formData.id) return;
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
      setLoading(true);
      try {
        await supabase.from('matches').delete().eq('id', formData.id);
        onClose();
      } catch (error) {
        console.error('Error deleting match:', error);
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Detail Pertandingan' : 'Tambah Pertandingan'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Kompetisi</label>
              <select 
                disabled={!isAdmin}
                value={formData.competitionId} 
                onChange={e => setFormData({...formData, competitionId: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">-- Pilih Kompetisi --</option>
                {competitions?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tahap (Stage)</label>
              <input type="text" disabled={!isAdmin} value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Group A, Final, etc." />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Tim Kandang (Home)</label>
              <input type="text" disabled={!isAdmin} value={formData.homeTeam} onChange={e => setFormData({...formData, homeTeam: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tim Tandang (Away)</label>
              <input type="text" disabled={!isAdmin} value={formData.awayTeam} onChange={e => setFormData({...formData, awayTeam: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal</label>
              <input type="date" disabled={!isAdmin} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Waktu</label>
              <input type="time" disabled={!isAdmin} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Venue / Lokasi</label>
              <input type="text" disabled={!isAdmin} value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select disabled={!isAdmin} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                <option value="Belum Main">Belum Main</option>
                <option value="Selesai">Selesai</option>
                <option value="Tunda">Tunda</option>
              </select>
            </div>
          </div>

          {/* Score & Result - Only show if finished */}
          {formData.status === 'Selesai' && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
              <h3 className="font-semibold text-gray-800">Hasil Pertandingan</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Skor {formData.homeTeam}</label>
                  <input type="number" disabled={!isAdmin} value={formData.scoreHome} onChange={e => setFormData({...formData, scoreHome: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Skor {formData.awayTeam}</label>
                  <input type="number" disabled={!isAdmin} value={formData.scoreAway} onChange={e => setFormData({...formData, scoreAway: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300" />
                </div>
              </div>
            </div>
          )}
          
          {/* Notes */}
          <div>
             <label className="block text-sm font-medium text-gray-700">Evaluasi Pelatih</label>
             <textarea disabled={!isAdmin} value={formData.evaluation} onChange={e => setFormData({...formData, evaluation: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows={3}></textarea>
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          {isAdmin && isEditing ? (
            <button onClick={handleDelete} disabled={loading} className="text-red-600 hover:text-red-800 flex items-center px-4 py-2 bg-red-50 rounded-md">
              <Trash2 size={18} className="mr-2"/> Hapus
            </button>
          ) : <div></div>}
          
          <div className="flex space-x-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Batal</button>
            {isAdmin && (
              <button onClick={handleSave} disabled={loading} className="flex items-center px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800">
                <Save size={18} className="mr-2"/> Simpan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
