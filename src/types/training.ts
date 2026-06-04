// Подход 
export interface ExerciseEntry {
  weight: number; 
  reps: number;   
}

export type TrainingSchedule = Record<string, ExerciseEntry[]>;
// Record - утилитный тип, который позволяет 
// создать тип объекта с определенным набором ключей и значений

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
  percentage?: number; // % от 1ПМ типо 85%
  pm?: number;   // повторный максимум например: 6ПМ,2ПМ и тд
}

// Конфиг недели: день - список конфигов
export interface ProgramConfig {
  [day: string]: DayConfig[];
}

// Данные программы пользователя
export interface UserProgramData {
  weeks: ProgramConfig[];  
  maxWeight?: number;
  repMaxes?: Record<number, number>; // например {6: 70, 3: 90}
  otherPMs?: Record<number, number> | null; 
}

// Полностью собранные данные программы
export interface CompleteProgramData {
  weeks: ProgramConfig[];
  maxWeight: number;
  repMaxes?: Record<number, number>;
  otherPMs?: Record<number, number> | null;
}

// Основное состояние пользователя
export interface UserData {
  gender?: 'male' | 'female';
  age?: number;
  weight?: number;

  // Результаты
  BS?: number; // жим
  PullUp?: number;
  PushUp?: number;
  Dips?: number;

  // Режим оценки упражнений юсера
  ratingMode?: boolean;
  ratingExercise?: 'bench' | 'pullups' | 'dips';

  // Конструктор программ
  programData?: UserProgramData;
  currentStep?: "days" | "percentages" | "sets" | "reps" | "maxWeight" 
             | "addWeek" | "dayPercentReps" | "dayPercentSetsReps" 
             | "know" | "knowOtherPMs" | "trainingPlan_maxWeight" 
             | "calc1pm_weight" | "calc1pm_bw" | "calc1pm_extra" | "calc1pm_reps" | null;
             //Текущий шаг юсера

  selectedPlan?: 'pullups' | 'bench_dips' | 'wrists' | 'other1' | 'other2' | null;

  // Данные калькулятора 1ПМ
  calc1pm_exercise?: 'bench' | 'pullups' | 'dips' | 'arm_bicep' | null;
  calc1pm_bw?: number;
  calc1pm_extra?: number;
  calc1pm_weight?: number;
  calc1pm_reps?: number;

  // Временные данные чтобы хранить промежуточные значения во время диалога
  tempDays?: string[] | null;
  tempPercentages?: number[];
  tempRepsPerDay?: number[];
  tempSets?: number;
  tempReps?: number;
  tempDayConfigs?: DayConfig[][] | DayConfig[] | null;
  otherPMs?: Record<number, number> | null;
 

  timestamp?: number;
  [key: string]: any;
}

export const repMaxTable: Record<number, number> = {
  1: 100,
  2: 95,
  3: 93,
  4: 90,
  5: 87,
  6: 85,
  7: 83,
  8: 80,
  9: 77,
  10: 75,
  11: 73,
  12: 70,
};