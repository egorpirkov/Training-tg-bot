import { TrainingSchedule } from "../types/training";

/**
 * Если weight ∈ (0,1] — считаем как процент от max, округляем к 2.5кг.
 * Если weight > 1 — оставляем как есть (считаем, что это кг).
 */
export const calculateWeights = (max: number, schedule: TrainingSchedule): TrainingSchedule => {
  const out: TrainingSchedule = {};
  for (const [day, entries] of Object.entries(schedule)) {
    out[day] = entries.map(({ weight, reps }) => {
      let w = weight;
      if (w > 0 && w <= 1) {
        w = Math.round((max * w) / 2.5) * 2.5;
      }
      return { weight: w, reps };
    });
  }
  return out;
};
