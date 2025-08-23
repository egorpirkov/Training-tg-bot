export interface ExerciseEntry {
  weight: number; // кг или доля (0..1)
  reps: number;
}

export type TrainingSchedule = Record<string, ExerciseEntry[]>;

export interface TrainingMemory {
  text?: string;
  schedule?: TrainingSchedule;
  maxWeight?: number;
  timestamp?: number;
}


export interface UserProgramData {
  days?: string[];
  exercise?: string;
  sets?: number;
  reps?: number[];
  percentages?: number[];
  maxWeight?: number;
}


// types/training.ts
export interface CompleteProgramData {
  days: string[];
  exercise: string;
  sets: number;
  reps: number[];
  percentages: number[];
  maxWeight: number;
}



export interface UserData {
  gender?: 'male' | 'female';
  age?: number;
  weight?: number;

  // Результаты
  BS?: number;
  PullUp?: number;
  PushUp?: number;

  // Режим оценки упражнений
  ratingMode?: boolean;
  ratingExercise?: 'bench' | 'pullups' | 'dips';

  // Мастер-форма для конструкторов программ
  exercise?: string;
  programData?: UserProgramData;
  currentStep?: 'days' | 'exercise' | 'sets' | 'reps' | 'percentages' | 'maxWeight';

  timestamp?: number;
  [key: string]: any;
}
