import { TrainingSchedule } from "../types/training";


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
