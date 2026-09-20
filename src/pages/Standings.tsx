import { useData } from '../contexts/DataContext';

export default function Standings() {
  const { activeCompetitionId, competitions, matches } = useData();

  const activeCompetition = competitions?.find((c: any) => c.id === activeCompetitionId);

  if (!activeCompetitionId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Silakan pilih kompetisi di header untuk melihat klasemen/bagan.
      </div>
    );
  }

  // Very basic standings computation
  const getStandings = () => {
    const table: Record<string, any> = {};
    const compMatches = matches.filter((m: any) => (m.competition_id === activeCompetitionId || m.competitionId === activeCompetitionId) && m.status === 'Selesai');
    
    compMatches.forEach((m: any) => {
      const home = m.home_team || m.homeTeam;
      const away = m.away_team || m.awayTeam;
      const sh = m.score_home ?? m.scoreHome ?? 0;
      const sa = m.score_away ?? m.scoreAway ?? 0;

      if (!table[home]) table[home] = { name: home, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
      if (!table[away]) table[away] = { name: away, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };

      table[home].p++; table[away].p++;
      table[home].gf += sh; table[home].ga += sa;
      table[away].gf += sa; table[away].ga += sh;

      if (sh > sa) {
        table[home].w++; table[home].pts += 3;
        table[away].l++;
      } else if (sa > sh) {
        table[away].w++; table[away].pts += 3;
        table[home].l++;
      } else {
        table[home].d++; table[home].pts += 1;
        table[away].d++; table[away].pts += 1;
      }
    });

    return Object.values(table).sort((a: any, b: any) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });
  };

  const standingsData = getStandings();

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Klasemen & Bagan</h1>
        <p className="text-gray-600">{activeCompetition?.name}</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Klasemen</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tim</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">M</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">M</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">S</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">K</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">MG</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">KG</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SG</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Poin</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standingsData.map((row: any, idx: number) => (
                <tr key={row.name} className={row.name.toLowerCase().includes('eagle') ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{row.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{row.p}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{row.w}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{row.d}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{row.l}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{row.gf}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{row.ga}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{row.gf - row.ga}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-900">{row.pts}</td>
                </tr>
              ))}
              {standingsData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada data pertandingan selesai.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
