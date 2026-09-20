import type { Match } from '../types';
import { MY_TEAM_NAME } from '../constants';

export const formatDate = (dateStr: string) => {
  if (!dateStr) return 'TBC';
  try {
      return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) { return 'TBC'; }
};

export const getMatchStatusColor = (status: string, dateStr: string) => {
    if (!dateStr) return 'bg-slate-100 text-slate-500';
    return status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
};

export const isEagleMatch = (match: Match) => {
    const checkEagle = (t?: string) => t?.toLowerCase().includes('eagle');
    if (match.homeTeam || match.awayTeam) {
        return checkEagle(match.homeTeam) || checkEagle(match.awayTeam) || match.homeTeam === MY_TEAM_NAME || match.awayTeam === MY_TEAM_NAME;
    }
    return !!match.opponent; 
};
