import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Plus } from 'lucide-react';
import MatchModal from '../components/features/match/MatchModal';

export default function Schedule() {

  const { matches = [], activeCompetitionId } = useData();
  const { isAdmin } = useAuth();
  
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [searchDate, setSearchDate] = useState('');
  
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const isEagleMatch = (match: any) => {
    return (match.home_team || match.homeTeam)?.toLowerCase().includes('eagle') || 
           (match.away_team || match.awayTeam)?.toLowerCase().includes('eagle');
  };

  const filteredMatches = matches.filter((match: any) => {
    if (activeCompetitionId && match.competition_id !== activeCompetitionId && match.competitionId !== activeCompetitionId) return false;
    if (filterType === 'Eagle Only' && !isEagleMatch(match)) return false;
    if (filterStatus !== 'Semua' && match.status !== filterStatus) return false;
    if (searchDate && match.date !== searchDate) return false;
    return true;
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEdit = (match: any) => {
    setSelectedMatch(match);
    setShowMatchModal(true);
  };

  const handleCreate = () => {
    setSelectedMatch(null);
    setShowMatchModal(true);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Jadwal Pertandingan</h1>
        </div>
        
        {isAdmin && (
          <button 
            onClick={handleCreate}
            className="flex items-center justify-center px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 shadow"
          >
            <Plus size={18} className="mr-2" /> Tambah Jadwal
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipe Pertandingan</label>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="text-sm border-gray-300 rounded-md"
          >
            <option value="All">Semua Tim</option>
            <option value="Eagle Only">Hanya Eagle</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border-gray-300 rounded-md"
          >
            <option value="Semua">Semua Status</option>
            <option value="Belum Main">Belum Main</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal</label>
          <input 
            type="date" 
            value={searchDate} 
            onChange={e => setSearchDate(e.target.value)}
            className="text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match: any) => {
            const isEagle = isEagleMatch(match);
            return (
              <div 
                key={match.id} 
                onClick={() => handleEdit(match)}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${isEagle ? 'border-green-600' : 'border-gray-200'}`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <div className="text-xs text-gray-500 flex space-x-2">
                      <span>{match.date} {match.time}</span>
                      <span>•</span>
                      <span>{match.venue}</span>
                      <span>•</span>
                      <span className="font-semibold text-gray-700">{match.stage}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="font-bold text-lg">{match.home_team || match.homeTeam}</div>
                      {match.status === 'Selesai' ? (
                        <div className="px-3 py-1 bg-green-100 text-green-800 font-bold rounded">
                          {(match.score_home ?? match.scoreHome) ?? 0} - {(match.score_away ?? match.scoreAway) ?? 0}
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-gray-100 text-gray-600 font-bold rounded">VS</div>
                      )}
                      <div className="font-bold text-lg">{match.away_team || match.awayTeam}</div>
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${match.status === 'Selesai' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {match.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Tidak ada pertandingan yang sesuai dengan filter.
          </div>
        )}
      </div>

      {showMatchModal && (
        <MatchModal match={selectedMatch} onClose={() => setShowMatchModal(false)} />
      )} 

    </div>
  );
}
