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

// out[day] = ... - создаёшь новый массив для конкретного дня

//max = 100, weight = 0.7 
// (100 * 0.7) = 70
// (70 / 2.5) = 28
// Math.round(28) = 28
// 28 * 2.5 = 70


// Смысл метода Object.entries

//const schedule = {
//   monday: [{ weight: 0.7, reps: 10 }],
//   wednesday: [{ weight: 0.8, reps: 8 }]
// };
// Object.entries(schedule);
// // [
// //   ["monday", [{ weight: 0.7, reps: 10 }]],
// //   ["wednesday", [{ weight: 0.8, reps: 8 }]]
// // ]
