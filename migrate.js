import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { createClient } from '@supabase/supabase-js';

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

const SUPABASE_URL = 'https://zjlfkjmffcejjpyoxzct.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbGZram1mZmNlampweW94emN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTAwMTAsImV4cCI6MjEwNTI4NjAxMH0.j24P3srAW-ldmiyZX5y2DCl3ga9S-efBDMAx8M5J05I';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FIREBASE_APP_ID = 'eagle-futsal-db-v3';
const basePath = `artifacts/${FIREBASE_APP_ID}/public/data`;

async function migrateCollection(collectionName, mapFn) {
  console.log(`Migrating ${collectionName}...`);
  try {
    const colRef = collection(db, `${basePath}/${collectionName}`);
    const snapshot = await getDocs(colRef);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Found ${data.length} records in Firebase.`);
    
    if (data.length === 0) return;

    const mappedData = data.map(mapFn);
    
    const { error } = await supabase.from(collectionName).upsert(mappedData);
    
    if (error) {
      console.error(`Error inserting into ${collectionName}:`, error.message);
    } else {
      console.log(`Successfully migrated ${data.length} records to ${collectionName}.`);
    }
  } catch (err) {
    console.error(`Failed to migrate ${collectionName}:`, err.message);
  }
}

async function runMigration() {
  console.log("Starting migration from Firebase to Supabase...");

  // 1. Competitions
  await migrateCollection('competitions', (row) => ({
    id: row.id,
    name: row.name || 'Unnamed',
    type: row.type || 'Exhibition',
    participants: row.participants || [],
    logo_url: row.logoUrl || null,
    created_at: row.createdAt || Date.now()
  }));

  // 2. Players
  await migrateCollection('players', (row) => ({
    id: Number(row.id), // ID is a number in schema
    name: row.name || '',
    full_name: row.fullName || row.name || '',
    number: row.number || 0,
    position: row.position || 'Flank',
    is_active: row.isActive !== false, // default true
    created_at: new Date().toISOString()
  }));

  // 3. Matches
  await migrateCollection('matches', (row) => ({
    id: String(row.id),
    competition_id: row.competitionId || null,
    stage: row.stage || null,
    home_team: row.homeTeam || row.opponent || 'Unknown',
    away_team: row.awayTeam || 'Eagle Futsal Academy', // fallback for legacy data
    date: row.date || null,
    time: row.time || null,
    venue: row.venue || null,
    status: row.status || 'Belum Main',
    match_type: row.matchType || null,
    score_home: row.scoreHome ?? row.scoreOpponent ?? 0,
    score_away: row.scoreAway ?? row.scoreEagle ?? 0,
    penalty_home: row.penaltyHome ?? row.penaltyOpponent ?? 0,
    penalty_away: row.penaltyAway ?? row.penaltyEagle ?? 0,
    wo_loser: row.woLoser || null,
    lineup: row.lineup || [],
    goals: JSON.stringify(row.goals || []), // Store as JSONB
    evaluation: row.evaluation || null,
    pre_match_notes: row.preMatchNotes || null
  }));

  // 4. Standings
  await migrateCollection('standings', (row) => ({
    id: String(row.id),
    competition_id: row.competitionId || null,
    team: row.team || '',
    played: row.played || 0,
    won: row.won || 0,
    won_pk: row.wonPK || 0,
    lost_pk: row.lostPK || 0,
    lost: row.lost || 0,
    goals_for: row.goalsFor || 0,
    goals_against: row.goalsAgainst || 0,
    goal_difference: row.goalDifference || 0,
    points: row.points || 0
  }));

  console.log("Migration complete!");
  process.exit(0);
}

runMigration();
