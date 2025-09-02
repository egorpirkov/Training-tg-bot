// Подход 
export interface ExerciseEntry {
  weight: number; // кг или доля (0..1)
  reps: number;   // кол-во повторений
}

// Расписание: день -> список подходов
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
  percentage?: number; // % от 1ПМ (если задано)
  pm?: number;         // повторный максимум (например, 6ПМ)
}

// Конфиг недели: день -> список конфигов
export interface ProgramConfig {
  [day: string]: DayConfig[];
}

// Данные программы (может быть неполным, в процессе заполнения)
export interface UserProgramData {
  weeks: ProgramConfig[];   // 👈 массив недель
  maxWeight?: number;
  repMaxes?: Record<number, number>; // например {6: 70, 3: 90}
  otherPMs?: Record<number, number> | null; // 👈 твои "повторные максимумы"
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
  BS?: number;
  PullUp?: number;
  PushUp?: number;

  // Режим оценки упражнений
  ratingMode?: boolean;
  ratingExercise?: 'bench' | 'pullups' | 'dips';

  // Конструктор программ
  programData?: UserProgramData;
  currentStep?: "days" | "percentages" | "sets" | "reps" | "maxWeight" 
             | "addWeek" | "dayPercentReps" | "dayPercentSetsReps" 
             | "know" | "knowOtherPMs" | null;

  // Временные данные
  tempDays?: string[] | null;
  tempPercentages?: number[];
  tempRepsPerDay?: number[];
  tempSets?: number;
  tempReps?: number;
  tempDayConfigs?: DayConfig[] | null;
  otherPMs?: Record<number, number> | null;

  timestamp?: number;
  [key: string]: any;
}

// Таблица "повторы → % от 1ПМ"
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