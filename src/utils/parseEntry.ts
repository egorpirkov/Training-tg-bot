// src/utils/parseEntry.ts

export type EntryConfig = {
  percent?: number;
  pm?: number;
  sets: number;
  reps: number;
};

export function parseEntry(line: string): EntryConfig | null {
  const trimmed = line.trim();

  // Формат: 70% 3x5
  let m = trimmed.match(/^(\d+)\s*%\s*(\d+)x(\d+)$/);
  if (m) {
    return {
      percent: parseInt(m[1]),
      sets: parseInt(m[2]),
      reps: parseInt(m[3]),
    };
  }

  // Формат: 70% x5
  m = trimmed.match(/^(\d+)\s*%\s*x\s*(\d+)$/);
  if (m) {
    return {
      percent: parseInt(m[1]),
      sets: 1,
      reps: parseInt(m[2]),
    };
  }

  // Формат: 6ПМ x3
  m = trimmed.match(/^(\d+)\s*пм\s*x\s*(\d+)$/i);
  if (m) {
    return {
      pm: parseInt(m[1]),
      sets: 1,
      reps: parseInt(m[2]),
    };
  }

  return null;
}
