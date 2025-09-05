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
  //<число>% <число>x<число>
  if (m) {
    return {
      percent: parseInt(m[1]),
      sets: parseInt(m[2]),
      reps: parseInt(m[3]),
    };
  }

//   Примеры совпадений

// "70% 3x5"
// → m[1] = "70", m[2] = "3", m[3] = "5".

// "85%1x10" (без пробела)
// → m[1] = "85", m[2] = "1", m[3] = "10".


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
