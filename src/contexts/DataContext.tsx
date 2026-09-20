import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Competition, Match, Player, Standing } from '../types';

interface DataContextType {
  competitions: Competition[];
  matches: Match[];
  players: Player[];
  standings: Standing[];
  activeCompetitionId: string;
  setActiveCompetitionId: (id: string) => void;
  loading: boolean;
  notification: string;
  showNotification: (msg: string) => void;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

const mapCompetition = (row: any): Competition => ({
  id: row.id,
  name: row.name,
  type: row.type,
  participants: row.participants || [],
  logoUrl: row.logo_url,
  createdAt: row.created_at,
});

const mapMatch = (row: any): Match => ({
  id: row.id,
  competitionId: row.competition_id,
  stage: row.stage,
  homeTeam: row.home_team,
  awayTeam: row.away_team,
  date: row.date,
  time: row.time,
  venue: row.venue,
  status: row.status,
  matchType: row.match_type,
  scoreHome: row.score_home,
  scoreAway: row.score_away,
  penaltyHome: row.penalty_home,
  penaltyAway: row.penalty_away,
  woLoser: row.wo_loser,
  lineup: row.lineup || [],
  goals: row.goals || [],
  evaluation: row.evaluation,
  preMatchNotes: row.pre_match_notes,
  // legacy mapping if needed
  opponent: row.opponent,
  scoreEagle: row.score_eagle,
  scoreOpponent: row.score_opponent,
  penaltyEagle: row.penalty_eagle,
  penaltyOpponent: row.penalty_opponent,
});

const mapPlayer = (row: any): Player => ({
  id: row.id,
  name: row.name,
  fullName: row.full_name,
  number: row.number,
  position: row.position,
  isActive: row.is_active,
  totalGoals: row.total_goals,
  totalApps: row.total_apps,
});

const mapStanding = (row: any): Standing => ({
  id: row.id,
  competitionId: row.competition_id,
  team: row.team,
  played: row.played,
  won: row.won,
  wonPK: row.won_pk,
  lostPK: row.lost_pk,
  lost: row.lost,
  goalsFor: row.goals_for,
  goalsAgainst: row.goals_against,
  goalDifference: row.goal_difference,
  points: row.points,
});

export const saveMatch = async (match: Match) => {
  const row = {
    id: match.id,
    competition_id: match.competitionId,
    stage: match.stage,
    home_team: match.homeTeam,
    away_team: match.awayTeam,
    date: match.date,
    time: match.time,
    venue: match.venue,
    status: match.status,
    match_type: match.matchType,
    score_home: match.scoreHome,
    score_away: match.scoreAway,
    penalty_home: match.penaltyHome,
    penalty_away: match.penaltyAway,
    wo_loser: match.woLoser,
    lineup: match.lineup,
    goals: match.goals,
    evaluation: match.evaluation,
    pre_match_notes: match.preMatchNotes,
  };
  await supabase.from('matches').upsert(row);
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [activeCompetitionId, setActiveCompetitionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string>('');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const fetchCompetitions = async () => {
    const { data } = await supabase.from('competitions').select('*').order('created_at');
    if (data) {
      const mapped = data.map(mapCompetition);
      setCompetitions(mapped);
      setLoading(current => {
        // activeCompetitionId setter relies on mapped value
        if (mapped.length > 0 && !activeCompetitionId) {
          setActiveCompetitionId(mapped[0].id);
        }
        return current;
      });
    }
  };

  const fetchMatches = async () => {
    const { data } = await supabase.from('matches').select('*');
    if (data) setMatches(data.map(mapMatch));
  };

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*');
    if (data) setPlayers(data.map(mapPlayer));
  };

  const fetchStandings = async () => {
    const { data } = await supabase.from('standings').select('*');
    if (data) setStandings(data.map(mapStanding));
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchCompetitions(),
      fetchMatches(),
      fetchPlayers(),
      fetchStandings()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const compsChannel = supabase.channel('competitions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => { fetchCompetitions(); })
      .subscribe();
      
    const matchesChannel = supabase.channel('matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { fetchMatches(); })
      .subscribe();

    const playersChannel = supabase.channel('players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => { fetchPlayers(); })
      .subscribe();

    const standingsChannel = supabase.channel('standings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'standings' }, () => { fetchStandings(); })
      .subscribe();

    return () => {
      supabase.removeChannel(compsChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(standingsChannel);
    };
  }, []);

  return (
    <DataContext.Provider value={{
      competitions,
      matches,
      players,
      standings,
      activeCompetitionId,
      setActiveCompetitionId,
      loading,
      notification,
      showNotification
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
