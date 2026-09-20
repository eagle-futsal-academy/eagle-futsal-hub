export interface Player {
  id: number;
  name: string;
  fullName: string;
  number: number;
  position: string;
  isActive?: boolean;
  totalGoals?: number;
  totalApps?: number;
}

export interface Goal {
  team?: string;
  scorerName?: string;
  eagleId?: number;
  playerId?: number;
  minute?: number;
}

export interface Match {
  id: string;
  competitionId?: string;
  stage?: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  status: string;
  matchType?: 'Home' | 'Away';
  scoreHome: number;
  scoreAway: number;
  penaltyHome: number;
  penaltyAway: number;
  woLoser?: 'Home' | 'Away';
  lineup: number[];
  goals: Goal[];
  evaluation?: string;
  preMatchNotes?: string;
  // legacy
  opponent?: string;
  scoreEagle?: number;
  scoreOpponent?: number;
  penaltyEagle?: number;
  penaltyOpponent?: number;
}

export interface Standing {
  id: string;
  competitionId?: string;
  team: string;
  played: number;
  won: number;
  wonPK: number;
  lostPK: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Competition {
  id: string;
  name: string;
  type: 'League' | 'Knockout' | 'Exhibition';
  participants?: string[];
  logoUrl?: string;
  createdAt?: number;
}

export interface Student {
  id: string;
  name: string;
  fullName: string;
  dob: string;
  ageCohort: 'U-5' | 'U-8' | 'U-12' | 'U-15';
  parentName?: string;
  parentPhone?: string;
  medicalNotes?: string;
  jerseySize?: string;
  jerseyNumber?: number;
  status: 'active' | 'inactive';
  photoUrl?: string;
  docAkte?: string;
  docKk?: string;
  docRaport?: string;
  docKia?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  sessionType: 'training' | 'match';
  scannedBy?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  studentId: string;
  type: 'SPP' | 'Kit' | 'Camp' | 'Event' | 'Other';
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate?: string;
  notes?: string;
  invoice_number?: string;
  items?: any[];
  subtotal?: number;
  discount?: number;
  total_amount?: number;
  payment_method?: string;
}

export interface InvoiceSetting {
  id: number;
  academy_name: string;
  academy_address: string;
  academy_phone: string;
  bank_name: string;
  bank_account: string;
  bank_account_name: string;
  invoice_prefix: string;
  invoice_notes: string;
}

export interface PerformanceEval {
  id: string;
  student_id: string;
  coach_name?: string;
  date: string;
  passing: number;
  dribbling: number;
  ball_control: number;
  shooting: number;
  tactical: number;
  composite_score?: number;
  notes?: string;
  created_at?: string;
}

export type UserRole = 'admin' | 'coach' | 'staff' | 'parent' | 'public';
