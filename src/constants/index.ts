import type { Match, Standing, Player } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyDNZNZNXI01w_SyD7kyVY7SmFp5hQTEC6M",
  authDomain: "eagle-futsal-manager.firebaseapp.com",
  projectId: "eagle-futsal-manager",
  storageBucket: "eagle-futsal-manager.firebasestorage.app",
  messagingSenderId: "364876226824",
  appId: "1:364876226824:web:894d13bb05d8d0e664ccbd"
};

export const FIREBASE_APP_ID = 'eagle-futsal-db-v3';
export const IS_CONFIGURED = !firebaseConfig.apiKey.includes("xxxxxx");

// --- DATA STATIC ---
export const LOGO_URL = "https://i.imgur.com/O94jI1M.png"; 
export const AAFI_LOGO_URL = "https://i.imgur.com/P7jyjWZ.png"; 
export const MY_TEAM_NAME = "Eagle Futsal Academy";

export const AAFI_TEAMS = [
  "Eagle Futsal Academy", "SG Excalibur", "Dakonbau", "Tujang Tajong", 
  "Vanna United", "Zizo FC", "Fafage Academy", "Bima FA", 
  "JC Interzone", "Bubiz FC", "Mutig FA", "Pesat FA"
];

export const INITIAL_PLAYERS: Player[] = [
  { id: 1, name: 'Benzema', fullName: 'Muhammad Benzema Putra Alamsyah', number: 8, position: 'Pivot' },
  { id: 2, name: 'Arif', fullName: 'Arif Putra Hafidz', number: 15, position: 'Flank' },
  { id: 3, name: 'Deril', fullName: 'Muhammad deril abdu abiyyu hakim', number: 10, position: 'Flank' },
  { id: 4, name: 'Hafidz', fullName: 'Muhammad Hafidz Habibullah', number: 4, position: 'Flank/Pivot' },
  { id: 5, name: 'Aldebaran', fullName: 'Muhammad Aldebaran Alfath', number: 6, position: 'Flank' },
  { id: 6, name: 'Uba', fullName: 'Ghaisan Ubaidillah', number: 11, position: 'Flank' },
  { id: 7, name: 'Laki', fullName: 'Lentera Abdi Laki', number: 18, position: 'GK' },
  { id: 8, name: 'Gibran', fullName: 'Gibran Safaras Yusup', number: 2, position: 'GK' },
  { id: 9, name: 'Rizky', fullName: 'Muhamad Rizky Sukanda', number: 17, position: 'Flank' },
  { id: 10, name: 'Abizhar', fullName: 'Abizhar nakhla al ghifari', number: 20, position: 'Flank' },
  { id: 11, name: 'AL', fullName: 'Cahaya Altaf Al Ikhsan', number: 7, position: 'Anchor' },
  { id: 12, name: 'Firash', fullName: 'Muhammad Firash Alghifari', number: 19, position: 'Flank' },
  { id: 13, name: 'ARIC', fullName: 'RAFIQI ALARIC NAIANDRA', number: 13, position: 'Anchor/Flank/Pivot' },
  { id: 14, name: 'Arfa', fullName: 'Muhammad Arfa Rafiandra', number: 14, position: 'Flank' },
  { id: 15, name: 'Anakin', fullName: 'Anakin Rahagi Yudes', number: 12, position: 'Pivot' },
  { id: 16, name: 'Lutfan', fullName: 'Lutfan Hafidz Abdurrahman', number: 3, position: 'Anchor' },
  { id: 17, name: 'Albier', fullName: 'Albier ahza zahraya', number: 9, position: 'Pivot' },
  { id: 18, name: 'Ghazi', fullName: 'Muhammad Ghazi Al Ghazali', number: 1, position: 'GK' },
  { id: 19, name: 'Faiz', fullName: 'RIZKY FAIZ MUBAROK', number: 5, position: 'Flank' },
  { id: 20, name: 'Bagas', fullName: 'Bagas Hikmah Putra', number: 16, position: 'Pivot' },
  { id: 21, name: 'M. Alwi', fullName: 'Muhammad Alwi Abdul Majid', number: 23, position: 'Anchor' },
  { id: 22, name: 'Arsyad', fullName: 'Muhammad Arsyad Firdaus', number: 21, position: 'Flank' },
];

export const SEED_MATCHES: Match[] = [
  { 
    id: 'match_1', homeTeam: 'Eagle Futsal Academy', awayTeam: 'SG Excalibur', date: '2024-02-10', time: '14:00', venue: 'Queen Futsal', status: 'Selesai', matchType: 'Home',
    scoreHome: 4, scoreAway: 4, penaltyHome: 3, penaltyAway: 2, lineup: [7, 11, 3, 1, 5, 14, 2, 15, 9], 
    goals: [ 
        { team: 'Eagle Futsal Academy', scorerName: 'Anakin', eagleId: 15, minute: 10 },
        { team: 'Eagle Futsal Academy', scorerName: 'Anakin', eagleId: 15, minute: 25 },
        { team: 'Eagle Futsal Academy', scorerName: 'Anakin', eagleId: 15, minute: 35 },
        { team: 'Eagle Futsal Academy', scorerName: 'Rizky', eagleId: 9, minute: 38 },
        { team: 'SG Excalibur', scorerName: 'Lawan A', minute: 5, eagleId: 0 },
        { team: 'SG Excalibur', scorerName: 'Lawan B', minute: 15, eagleId: 0 },
        { team: 'SG Excalibur', scorerName: 'Lawan C', minute: 40, eagleId: 0 },
        { team: 'SG Excalibur', scorerName: 'Lawan D', minute: 45, eagleId: 0 },
    ] 
  }
];

export const SEED_STANDINGS: Standing[] = [
  { id: 'team_1', team: 'Dakonbau', played: 1, won: 1, wonPK: 0, lostPK: 0, lost: 0, goalsFor: 7, goalsAgainst: 0, goalDifference: 7, points: 3 },
  { id: 'team_2', team: 'Tujang Tajong FA', played: 0, won: 0, wonPK: 0, lostPK: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
  { id: 'team_5', team: 'Eagle Futsal Academy', played: 1, won: 0, wonPK: 1, lostPK: 0, lost: 0, goalsFor: 4, goalsAgainst: 4, goalDifference: 0, points: 2 },
];
