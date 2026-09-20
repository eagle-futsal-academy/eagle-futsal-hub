import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyDNZNZNXI01w_SyD7kyVY7SmFp5hQTEC6M",
  authDomain: "eagle-futsal-manager.firebaseapp.com",
  projectId: "eagle-futsal-manager",
  storageBucket: "eagle-futsal-manager.firebasestorage.app",
  messagingSenderId: "364876226824",
  appId: "1:364876226824:web:894d13bb05d8d0e664ccbd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FIREBASE_APP_ID = 'eagle-futsal-db-v3';
const basePath = `artifacts/${FIREBASE_APP_ID}/public/data`;

function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeSqlJson(obj) {
  if (!obj) return `'[]'::jsonb`;
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

function escapeSqlArray(arr) {
  if (!arr || arr.length === 0) return `'{}'`;
  // Simple text array for strings/numbers
  const formatted = arr.map(i => `"${String(i).replace(/"/g, '""')}"`).join(',');
  return `'{${formatted}}'`;
}

async function runExport() {
  console.log("Generating SQL export...");
  let sqlOutput = "-- Supabase Migration SQL\n\n";

  // 1. Competitions
  const compRef = collection(db, `${basePath}/competitions`);
  const compSnap = await getDocs(compRef);
  if (compSnap.docs.length > 0) {
    sqlOutput += `INSERT INTO competitions (id, name, type, participants, logo_url, created_at) VALUES\n`;
    const values = compSnap.docs.map(doc => {
      const r = doc.data();
      return `(${escapeSqlString(doc.id)}, ${escapeSqlString(r.name || 'Unnamed')}, ${escapeSqlString(r.type || 'Exhibition')}, ${escapeSqlArray(r.participants)}, ${escapeSqlString(r.logoUrl)}, ${r.createdAt || Date.now()})`;
    });
    sqlOutput += values.join(",\n") + " ON CONFLICT (id) DO NOTHING;\n\n";
  }

  // 2. Players
  const playRef = collection(db, `${basePath}/players`);
  const playSnap = await getDocs(playRef);
  if (playSnap.docs.length > 0) {
    sqlOutput += `INSERT INTO players (id, name, full_name, number, position, is_active) VALUES\n`;
    const values = playSnap.docs.map(doc => {
      const r = doc.data();
      return `(${Number(doc.id)}, ${escapeSqlString(r.name)}, ${escapeSqlString(r.fullName || r.name)}, ${Number(r.number || 0)}, ${escapeSqlString(r.position || 'Flank')}, ${r.isActive !== false})`;
    });
    sqlOutput += values.join(",\n") + " ON CONFLICT (id) DO NOTHING;\n\n";
  }

  // 3. Matches
  const matchRef = collection(db, `${basePath}/matches`);
  const matchSnap = await getDocs(matchRef);
  if (matchSnap.docs.length > 0) {
    sqlOutput += `INSERT INTO matches (id, competition_id, stage, home_team, away_team, date, time, venue, status, match_type, score_home, score_away, penalty_home, penalty_away, wo_loser, lineup, goals, evaluation, pre_match_notes) VALUES\n`;
    const values = matchSnap.docs.map(doc => {
      const r = doc.data();
      return `(${escapeSqlString(doc.id)}, ${escapeSqlString(r.competitionId)}, ${escapeSqlString(r.stage)}, ${escapeSqlString(r.homeTeam || r.opponent || 'Unknown')}, ${escapeSqlString(r.awayTeam || 'Eagle Futsal Academy')}, ${escapeSqlString(r.date)}, ${escapeSqlString(r.time)}, ${escapeSqlString(r.venue)}, ${escapeSqlString(r.status || 'Belum Main')}, ${escapeSqlString(r.matchType)}, ${r.scoreHome ?? r.scoreOpponent ?? 0}, ${r.scoreAway ?? r.scoreEagle ?? 0}, ${r.penaltyHome ?? r.penaltyOpponent ?? 0}, ${r.penaltyAway ?? r.penaltyEagle ?? 0}, ${escapeSqlString(r.woLoser)}, ${escapeSqlArray(r.lineup)}, ${escapeSqlJson(r.goals)}, ${escapeSqlString(r.evaluation)}, ${escapeSqlString(r.preMatchNotes)})`;
    });
    sqlOutput += values.join(",\n") + " ON CONFLICT (id) DO NOTHING;\n\n";
  }

  // 4. Standings
  const stdRef = collection(db, `${basePath}/standings`);
  const stdSnap = await getDocs(stdRef);
  if (stdSnap.docs.length > 0) {
    sqlOutput += `INSERT INTO standings (id, competition_id, team, played, won, won_pk, lost_pk, lost, goals_for, goals_against, goal_difference, points) VALUES\n`;
    const values = stdSnap.docs.map(doc => {
      const r = doc.data();
      return `(${escapeSqlString(doc.id)}, ${escapeSqlString(r.competitionId)}, ${escapeSqlString(r.team)}, ${r.played || 0}, ${r.won || 0}, ${r.wonPK || 0}, ${r.lostPK || 0}, ${r.lost || 0}, ${r.goalsFor || 0}, ${r.goalsAgainst || 0}, ${r.goalDifference || 0}, ${r.points || 0})`;
    });
    sqlOutput += values.join(",\n") + " ON CONFLICT (id) DO NOTHING;\n\n";
  }

  fs.writeFileSync('migration.sql', sqlOutput);
  console.log("Generated migration.sql successfully!");
  process.exit(0);
}

runExport();
