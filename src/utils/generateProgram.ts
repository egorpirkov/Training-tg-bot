import { TrainingSchedule } from "../types/training";

type ProgramType = 'linear' | 'wave' | 'undulating';

export const generateProgram = (
  base: TrainingSchedule,
  maxWeight: number,
  programType: ProgramType = 'linear'
): TrainingSchedule => {
  const generated: TrainingSchedule = {};
  const ratios: Record<ProgramType, number[]> = {
    linear: [0.7, 0.75, 0.8],
    wave: [0.65, 0.75, 0.85],
    undulating: [0.6, 0.7, 0.8],
  };

  Object.entries(base).forEach(([day, list], idx) => {
    const r = ratios[programType][idx % ratios[programType].length];
    generated[day] = list.map(e => ({
      weight: Math.round((maxWeight * r) / 2.5) * 2.5,
      reps: e.reps > 12 ? 8 : Math.max(e.reps, 3),
    }));
  });

  return generated;
};
