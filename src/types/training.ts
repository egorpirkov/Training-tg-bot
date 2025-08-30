// Подход (фиксированные веса или доли)
export interface ExerciseEntry {
  weight: number; // кг или доля (0..1)
  reps: number;
}

// Расписание: день -> список подходов
export type TrainingSchedule = Record<string, ExerciseEntry[]>;

// Память для временных сохранений тренировок
export interface TrainingMemory {
  text?: string;
  schedule?: TrainingSchedule;
  maxWeight?: number;
  timestamp?: number;
  arr?: any[];
}

// Конфиг дня
export interface DayConfig {
  sets: number;
  reps: number;
  percentage: number; // % от 1ПМ
}

// Конфиг недели
export interface ProgramConfig {
  [day: string]: DayConfig;
}

// Данные программы (может быть неполным, в процессе заполнения)
export interface UserProgramData {
  weeks: ProgramConfig[];   // 👈 теперь всегда массив недель
  maxWeight?: number;
}

// Полностью собранные данные программы
export interface CompleteProgramData {
  weeks: ProgramConfig[];
  maxWeight: number;
}

// Основное состояние пользователя
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

  // Конструктор программ
  programData?: UserProgramData;
  currentStep?:
  | 'days'
  | 'percentages'
  | 'sets'
  | 'reps'
  | 'maxWeight'
  | 'addWeek'
  | 'dayPercentReps'
  | 'dayPercentSetsReps';
  
  // Временные данные (чтобы не потерять шаги между сообщениями)
  tempDays?: string[];
  tempPercentages?: number[];
  tempRepsPerDay?: number[];
  tempSets?: number;
  tempReps?: number;

  timestamp?: number;
  [key: string]: any;
}
