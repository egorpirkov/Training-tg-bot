export interface ExerciseSet {
  setIndex: number;
  weight: number;
  reps: number;
  note?: string;
}

export interface Exercise {
  name: string;
  sets: any;
  weightKg?: number;
  reps?: any;
  repsList?: number[];
  note?: string;
}

export interface Day {
  dayName: string;
  exercises: Exercise[];
}

export interface Week {
  weekIndex: number;
  days: Day[];
}

export interface ProgramData {
  key: string;
  title: string;
  userWeight?: number;
  weeks: Week[];
  selectedExercise?: 'bench' | 'dips' | 'wrist_curls' | 'pronator' | 'side_pressure';
  completedWeeks?: number[];
}

export interface CompletedSetKey {
  weekIndex: number;
  dayName: string;
  exerciseIndex: number;
  setIndex: number;
}

export interface PostponedTraining {
  weekIndex: number;
  dayName: string;
  reason: 'sleep' | 'fatigue' | 'other';
  reasonText?: string;
  newDay: string;
}

export interface UserStats {
  totalTonnage: number;
  completedSetsCount: number;
  activeDaysCount: number;
}

export interface UserRecord {
  id: number;
  movement: string;
  category: 'bench' | 'dips' | 'pullups' | 'other';
  weight: number;
  reps: number;
  onePm: number;
  videoPath?: string;
  createdAt: string;
  likes?: number;
}
