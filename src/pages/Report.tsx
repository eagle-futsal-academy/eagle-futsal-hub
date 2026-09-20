import { useData } from '../contexts/DataContext';
import { Printer } from 'lucide-react';

export default function Report() {
  const { activeCompetitionId, competitions, matches } = useData();
  
  const activeCompetition = competitions?.find((c: any) => c.id === activeCompetitionId);
  const compMatches = matches.filter((m: any) => (m.competition_id === activeCompetitionId || m.competitionId === activeCompetitionId));
  const upcomingMatches = compMatches.filter((m: any) => m.status !== 'Selesai');
  const pastMatches = compMatches.filter((m: any) => m.status === 'Selesai');

  const handlePrint = () => {
    window.print();
  };

  if (!activeCompetitionId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Silakan pilih kompetisi di header untuk melihat laporan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style type="text/css" media="print">
        {`@page { size: landscape; margin: 10mm; }`}
      </style>
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Kompetisi</h1>
        <button 
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800"
        >
          <Printer size={18} className="mr-2" /> Cetak Laporan
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow print:shadow-none print:p-0">
        <div className="text-center mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold uppercase">{activeCompetition?.name}</h2>
          <p className="text-gray-500">Eagle Futsal Academy</p>
          <p className="text-sm text-gray-400 mt-2">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b border-green-900 pb-1 inline-block">Jadwal Mendatang</h3>
          <table className="min-w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Tanggal</th>
                <th className="border border-gray-300 p-2 text-left">Waktu</th>
                <th className="border border-gray-300 p-2 text-left">Pertandingan</th>
                <th className="border border-gray-300 p-2 text-left">Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {upcomingMatches.length > 0 ? upcomingMatches.map((m: any) => (
                <tr key={m.id}>
                  <td className="border border-gray-300 p-2">{m.date}</td>
                  <td className="border border-gray-300 p-2">{m.time}</td>
                  <td className="border border-gray-300 p-2 font-semibold">
                    {m.home_team || m.homeTeam} vs {m.away_team || m.awayTeam}
                  </td>
                  <td className="border border-gray-300 p-2">{m.venue}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="border border-gray-300 p-4 text-center text-gray-500">Tidak ada jadwal mendatang</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b border-green-900 pb-1 inline-block">Hasil Pertandingan</h3>
          <table className="min-w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Tanggal</th>
                <th className="border border-gray-300 p-2 text-left">Pertandingan</th>
                <th className="border border-gray-300 p-2 text-center">Skor</th>
              </tr>
            </thead>
            <tbody>
              {pastMatches.length > 0 ? pastMatches.map((m: any) => (
                <tr key={m.id}>
                  <td className="border border-gray-300 p-2">{m.date}</td>
                  <td className="border border-gray-300 p-2 font-semibold">
                    {m.home_team || m.homeTeam} vs {m.away_team || m.awayTeam}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-bold">
                    {(m.score_home ?? m.scoreHome) ?? 0} - {(m.score_away ?? m.scoreAway) ?? 0}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="border border-gray-300 p-4 text-center text-gray-500">Belum ada hasil pertandingan</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
