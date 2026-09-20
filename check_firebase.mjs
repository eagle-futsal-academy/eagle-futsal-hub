import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';

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

async function checkData() {
  try {
    const pathsToCheck = ['eagle-futsal-db-v3', 'v1', 'eagle-futsal-db-v2', 'eagle-futsal-db'];
    
    for (const p of pathsToCheck) {
      console.log(`Checking path: artifacts/${p}/public/data/matches ...`);
      const matchesRef = collection(db, 'artifacts', p, 'public', 'data', 'matches');
      const snap = await getDocs(matchesRef);
      console.log(`- Found ${snap.size} matches!`);
      if (snap.size > 0) {
        snap.forEach(doc => {
            console.log(`  * ${doc.id}: ${doc.data().homeTeam} vs ${doc.data().awayTeam}`);
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
}

checkData();
