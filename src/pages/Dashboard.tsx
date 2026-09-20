import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/SupabaseAuthContext';
export default function Dashboard() {
  const { matches = [], players = [], competitions = [] } = useData();
  const { isAdmin } = useAuth();

  const isEagleMatch = (match: any) => {
    return (match.home_team || match.homeTeam)?.toLowerCase().includes('eagle') || 
           (match.away_team || match.awayTeam)?.toLowerCase().includes('eagle');
  };

  const eagleMatches = matches.filter(isEagleMatch);
  
  const totalMatches = eagleMatches.length;
  
  const wonMatches = eagleMatches.filter((m: any) => {
    if (m.status !== 'Selesai') return false;
    const isHome = (m.home_team || m.homeTeam)?.toLowerCase().includes('eagle');
    const scoreHome = m.score_home ?? m.scoreHome ?? 0;
    const scoreAway = m.score_away ?? m.scoreAway ?? 0;
    if (isHome) return scoreHome > scoreAway;
    return scoreAway > scoreHome;
  });

  const nextMatch = eagleMatches
    .filter((m: any) => m.status !== 'Selesai')
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const recentMatches = [...eagleMatches]
    .filter((m: any) => m.status === 'Selesai')
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Selamat Datang di EagleHub</h1>
        <p className="text-gray-600">Eagle Futsal Academy</p>
      </div>

      {!isAdmin && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md shadow-sm">
          <p className="text-sm text-blue-700">Login sebagai admin untuk mengelola data kompetisi dan akademi.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-700">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Pertandingan</div>
          <div className="text-2xl font-bold text-gray-900">{totalMatches}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-700">
          <div className="text-sm font-medium text-gray-500 mb-1">Menang</div>
          <div className="text-2xl font-bold text-gray-900">{wonMatches.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Pemain</div>
          <div className="text-2xl font-bold text-gray-900">{players.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-500 mb-1">Kompetisi Aktif</div>
          <div className="text-2xl font-bold text-gray-900">{competitions.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Match */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Pertandingan Berikutnya</h2>
          </div>
          <div className="p-6">
            {nextMatch ? (
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-2">{nextMatch.date} • {nextMatch.time} • {nextMatch.venue}</div>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-lg font-bold w-1/3 text-right">{nextMatch.homeTeam}</div>
                  <div className="px-3 py-1 bg-gray-100 rounded text-sm font-bold text-gray-600">VS</div>
                  <div className="text-lg font-bold w-1/3 text-left">{nextMatch.awayTeam}</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada jadwal pertandingan berikutnya.</p>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Hasil Terakhir</h2>
          </div>
          <div className="p-0">
            {recentMatches.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentMatches.map((match: any) => (
                  <li key={match.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">{match.date}</span>
                      <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">{match.stage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-800 flex-1">{match.home_team || match.homeTeam}</div>
                      <div className="px-4 py-1 bg-green-100 text-green-800 font-bold rounded mx-4 min-w-[4rem] text-center">
                        {(match.score_home ?? match.scoreHome) ?? 0} - {(match.score_away ?? match.scoreAway) ?? 0}
                      </div>
                      <div className="font-semibold text-gray-800 flex-1 text-right">{match.away_team || match.awayTeam}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8">Belum ada hasil pertandingan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
