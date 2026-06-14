export const tg = (window as any).Telegram?.WebApp;
export const tgUser = tg?.initDataUnsafe?.user;
export const urlParams = new URLSearchParams(window.location.search);
export const DEFAULT_CHAT_ID = 7491644806;
export const chatId = tgUser?.id || parseInt(urlParams.get('chatId') || String(DEFAULT_CHAT_ID), 10);

export const WEEK_DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export const getCategoryLabel = (cat: string, movement: string = '') => {
  const normalizedCat = (cat || '').toLowerCase().trim();
  const labels: Record<string, string> = {
    bench: 'Жим штанги лёжа',
    dips: 'Брусья',
    pullups: 'Подтягивания',
    other: 'Другое'
  };
  
  if (labels[normalizedCat]) {
    return labels[normalizedCat];
  }
  
  const m = (movement || '').toLowerCase();
  if (m.includes('жим') || m.includes('bench')) {
    return labels.bench;
  }
  if (m.includes('брусь') || m.includes('дипс') || m.includes('dips')) {
    return labels.dips;
  }
  if (m.includes('подтяг') || m.includes('pull') || m.includes('выход')) {
    return labels.pullups;
  }
  
  return labels.other;
};

export const reasonLabel = (r: string) => {
  return r === 'sleep' ? 'Недосып' : r === 'fatigue' ? 'Усталость' : 'Другое';
};

import type { ExerciseSet } from './types';

export const getExerciseSets = (ex: any): ExerciseSet[] => {
  if (ex.repsList && Array.isArray(ex.repsList)) {
    return ex.repsList.map((reps: number, idx: number) => ({ setIndex: idx + 1, weight: ex.weightKg || 0, reps, note: ex.note }));
  }
  const count = typeof ex.sets === 'number' ? ex.sets : 1;
  const reps = typeof ex.reps === 'number' ? ex.reps : parseInt(ex.reps, 10) || 5;
  return Array.from({ length: count }, (_, i) => ({ setIndex: i + 1, weight: ex.weightKg || 0, reps, note: ex.note }));
};
