import React, { useState, useEffect } from 'react';
import './App.css';
import type { 
  ProgramData, 
  CompletedSetKey, 
  UserStats, 
  UserRecord, 
  PostponedTraining,
  Week,
  Day
} from './utils/types';
import { 
  tg, 
  chatId, 
  WEEK_DAYS, 
  getExerciseSets 
} from './utils/helpers';
import { AlertModal } from './components/AlertModal';
import { HelpModal } from './components/HelpModal';
import { RescheduleModal } from './components/RescheduleModal';
import { WorkoutsTab } from './components/tabs/WorkoutsTab';
import { StatsTab } from './components/tabs/StatsTab';
import { RecordsTab } from './components/tabs/RecordsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workouts' | 'stats' | 'records'>('workouts');
  const [programs, setPrograms] = useState<ProgramData[]>([]);
  const [activeProgramTitle, setActiveProgramTitle] = useState<string | null>(null);
  
  const program = programs.find(p => p.title === activeProgramTitle) || programs[0] || null;

  const setProgram = (prog: ProgramData | null) => {
    if (!prog) return;
    setPrograms(prev => {
      const idx = prev.findIndex(p => p.title === prog.title);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = prog;
        return next;
      }
      return [...prev, prog];
    });
    setActiveProgramTitle(prev => prev || prog.title);
  };

  const [completedSets, setCompletedSets] = useState<Array<CompletedSetKey & { weight: number; reps: number }>>([]);
  const [, setStats] = useState<UserStats>({ totalTonnage: 0, completedSetsCount: 0, activeDaysCount: 0 });
  const [userWeight, setUserWeight] = useState<number>(80);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<string>('пн');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingWeight, setSavingWeight] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [postponed] = useState<PostponedTraining[]>([]);
  const [hideWarmupNotice, setHideWarmupNotice] = useState<boolean>(
    localStorage.getItem('hideWarmupNotice') === 'true'
  );

//Зал славы
  const [records, setRecords] = useState<UserRecord[]>([]);
  const [recMovement, setRecMovement] = useState('');
  const [recCategory, setRecCategory] = useState<'bench' | 'dips' | 'pullups' | 'other'>('bench');
  const [recWeight, setRecWeight] = useState('');
  const [recReps, setRecReps] = useState('');
  const [recVideoFile, setRecVideoFile] = useState<File | null>(null);
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const [sharingRecordId, setSharingRecordId] = useState<number | null>(null);
  const [recordsTab, setRecordsTab] = useState<'my' | 'global'>('my');
  const [globalRecords, setGlobalRecords] = useState<UserRecord[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [likedRecordIds, setLikedRecordIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('likedRecordIds') || '[]');
    } catch {
      return [];
    }
  });

  const loadGlobalRecords = async () => {
    try {
      setLoadingGlobal(true);
      const res = await fetch('/api/records/global');
      if (res.ok) {
        setGlobalRecords(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    if (recordsTab === 'global') {
      loadGlobalRecords();
    }
  }, [recordsTab]);
  

  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');

  const calculateWeb1PM = () => {
    const w = parseFloat(calcWeight);
    const r = parseInt(calcReps, 10);
    if (isNaN(w) || isNaN(r) || w < 0 || r <= 0) return 0;
    
    const isPullups = program?.title.includes('Подтягивания');
    const isDips = program?.title.includes('Брусья');
    const isWeighted = isPullups || isDips;
    
    let factor = 1.0;
    if (r > 1) {
      if (r <= 10) {
        factor = 1 / (1.0278 - 0.0278 * r);
      } else {
        factor = 1.059 * Math.pow(r, 0.10);
      }
    }
    
    if (isWeighted) {
      const totalWeight = userWeight + w;
      const total1PM = totalWeight * factor;
      const extra1PM = total1PM - userWeight;
      return Math.round(Math.max(0, extra1PM) * 10) / 10;
    } else {
      const total1PM = w * factor;
      return Math.round(total1PM * 10) / 10;
    }
  };
  
  const [chartCategory, setChartCategory] = useState<'bench' | 'dips' | 'pullups' | 'other'>('bench');

  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [postponeReason, setPostponeReason] = useState<'sleep' | 'fatigue' | 'other'>('sleep');
  const [postponeReasonText, setPostponeReasonText] = useState('');
  const [postponeNewDay, setPostponeNewDay] = useState('сб');

  const [showHelpModal, setShowHelpModal] = useState(false);

  const [customAlert, setCustomAlert] = useState<string | null>(null);
  const alert = (message: string) => {
    setCustomAlert(message);
  };

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#060913');
      tg.setBackgroundColor('#060913');
    }
  }, []);

  const logToServer = (message: string) => {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    }).catch(() => {});
  };

  logToServer(`RENDER: selectedWeek=${selectedWeek}, selectedDay=${selectedDay}, program=${!!program}, loading=${loading}`);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      logToServer(`loadUserData: fetching programs for chatId=${chatId}`);
      const progRes = await fetch(`/api/program?chatId=${chatId}`);
      if (progRes.ok) {
        const progDataArray = await progRes.json();
        const loadedPrograms: ProgramData[] = [];
        
        if (Array.isArray(progDataArray)) {
          progDataArray.forEach(item => {
            const prog = item.programData;
            if (prog && prog.weeks) {
              loadedPrograms.push(prog);
            }
          });
        }
        
        setPrograms(loadedPrograms);
        
        let initialProgram: ProgramData | null = null;
        if (loadedPrograms.length > 0) {
          const savedTitle = localStorage.getItem('activeProgramTitle');
          const matched = loadedPrograms.find(p => p.title === savedTitle);
          if (matched) {
            initialProgram = matched;
            setActiveProgramTitle(matched.title);
          } else {
            initialProgram = loadedPrograms[0];
            setActiveProgramTitle(loadedPrograms[0].title);
            localStorage.setItem('activeProgramTitle', loadedPrograms[0].title);
          }
        } else {
          setActiveProgramTitle(null);
        }
        
        if (initialProgram) {
          if (initialProgram.userWeight) setUserWeight(initialProgram.userWeight);
          
          if (initialProgram.weeks && initialProgram.weeks.length > 0) {
            const completedWeeks = initialProgram.completedWeeks || [];
            let targetWeek = initialProgram.weeks.find((w: Week) => !completedWeeks.includes(w.weekIndex));
            if (!targetWeek) {
              targetWeek = initialProgram.weeks[initialProgram.weeks.length - 1];
            }
            if (targetWeek) {
              logToServer(`loadUserData: setting selectedWeek=${targetWeek.weekIndex}, selectedDay=${targetWeek.days[0]?.dayName}`);
              setSelectedWeek(targetWeek.weekIndex);
              if (targetWeek.days && targetWeek.days.length > 0) {
                setSelectedDay(targetWeek.days[0].dayName);
              }
            }
          }
        }
      } else {
        throw new Error('Ошибка при загрузке программ');
      }
      const setsRes = await fetch(`/api/completed-sets?chatId=${chatId}`);
      if (setsRes.ok) setCompletedSets(await setsRes.json());
      const statsRes = await fetch(`/api/stats?chatId=${chatId}`);
      if (statsRes.ok) setStats(await statsRes.json());
      const recsRes = await fetch(`/api/records?chatId=${chatId}`);
      if (recsRes.ok) setRecords(await recsRes.json());
    } catch (err) {
      setApiError('Не удалось подключиться к серверу бота.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUserData(); }, []);

  const getExerciseOffset = (): number => {
    if (!program) return 0;
    if (program.title.includes('Подтягивания')) return 100;
    if (program.title.includes('кисть') || program.title.includes('пронатор') || program.title.includes('давление') || program.title.includes('Скручивание')) return 200;
    if (program.title.includes('Жим') || program.title.includes('Брусья')) return 300;
    return 0;
  };

  const isSetCompleted = (weekIndex: number, dayName: string, exerciseIndex: number, setIndex: number) => {
    const offset = getExerciseOffset();
    const dbIdx = exerciseIndex + offset;
    return completedSets.some(i => i.weekIndex === weekIndex && i.dayName === dayName && i.exerciseIndex === dbIdx && i.setIndex === setIndex);
  };

  const toggleSetCompletion = async (weekIndex: number, dayName: string, exerciseIndex: number, setIndex: number, weight: number, reps: number) => {
    const offset = getExerciseOffset();
    const dbIdx = exerciseIndex + offset;
    const isCompleted = isSetCompleted(weekIndex, dayName, exerciseIndex, setIndex);
    if (!isCompleted) {
      setCompletedSets(prev => [...prev, { weekIndex, dayName, exerciseIndex: dbIdx, setIndex, weight, reps }]);
    } else {
      setCompletedSets(prev => prev.filter(i => !(i.weekIndex === weekIndex && i.dayName === dayName && i.exerciseIndex === dbIdx && i.setIndex === setIndex)));
    }
    try {
      const res = await fetch('/api/completed-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, weekIndex, dayName, exerciseIndex: dbIdx, setIndex, weight, reps, completed: !isCompleted })
      });
      if (res.ok) {
        const statsRes = await fetch(`/api/stats?chatId=${chatId}`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        loadUserData();
      }
    } catch { loadUserData(); }
  };

  const getDayTonnage = (week: Week, day: Day): number => {
    let tonnage = 0;
    day.exercises.forEach((ex, exIdx) => {
      getExerciseSets(ex).forEach(set => {
        if (isSetCompleted(week.weekIndex, day.dayName, exIdx, set.setIndex)) {
          const isPullups = program?.title?.includes('Подтягивания');
          tonnage += (isPullups ? userWeight + set.weight : set.weight) * set.reps;
        }
      });
    });
    return Math.round(tonnage);
  };

  const getPostponeInfo = (weekIndex: number, dayName: string) =>
    postponed.find(p => p.weekIndex === weekIndex && p.dayName === dayName);

  const handlePostpone = async () => {
    if (!program || !currentWeekObj) return;

    const oldDayIndex = WEEK_DAYS.indexOf(selectedDay);
    const newDayIndex = WEEK_DAYS.indexOf(postponeNewDay);
    const diff = newDayIndex - oldDayIndex;

    if (diff <= 0) {
      alert('Перенести можно только на более поздний день!');
      return;
    }

    const getShiftedDayName = (dayName: string, d: number) => {
      const idx = WEEK_DAYS.indexOf(dayName);
      const newIdx = Math.min(6, idx + d);
      return WEEK_DAYS[newIdx];
    };

    const dayInWeekIdx = currentWeekObj.days.findIndex(d => d.dayName === selectedDay);

    const updatedDays = currentWeekObj.days.map((dayObj, idx) => {
      if (idx >= dayInWeekIdx) {
        return {
          ...dayObj,
          dayName: getShiftedDayName(dayObj.dayName, diff)
        };
      }
      return dayObj;
    });

    const updatedWeeks = program.weeks.map(w => {
      if (w.weekIndex === selectedWeek) {
        return {
          ...w,
          days: updatedDays
        };
      }
      return w;
    });

    const updatedProgram: ProgramData = {
      ...program,
      weeks: updatedWeeks
    };

    try {
      const res = await fetch('/api/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, title: program.title, programData: updatedProgram })
      });

      if (res.ok) {
        setProgram(updatedProgram);
        const newSelectedDayName = getShiftedDayName(selectedDay, diff);
        setSelectedDay(newSelectedDayName);
        alert(`Тренировки перенесены! Расписание недели: ${updatedDays.map(d => d.dayName.toUpperCase()).join(', ')}`);
      } else {
        alert('Не удалось сохранить перенос в базе данных.');
      }
    } catch (err) {
      alert('Ошибка при переносе тренировки.');
    } finally {
      setShowPostponeModal(false);
      setPostponeReasonText('');
    }
  };

  const handleExerciseChoice = async (choice: 'bench' | 'dips') => {
    if (!program) return;
    const exerciseName = choice === 'bench' ? 'Жим штанги лёжа' : 'Отжимания на брусьях с доп.весом';

    const updatedWeeks = program.weeks.map(w => ({
      ...w,
      days: w.days.map(d => ({
        ...d,
        exercises: d.exercises.map(ex => {
          if (ex.name === "Жим / Брусья") {
            return { ...ex, name: exerciseName };
          }
          return ex;
        })
      }))
    }));

    const updatedProgram: ProgramData = {
      ...program,
      selectedExercise: choice,
      weeks: updatedWeeks
    };

    try {
      const res = await fetch('/api/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, title: program.title, programData: updatedProgram })
      });
      if (res.ok) {
        setPrograms(prev => prev.map(p => p.title === program.title ? updatedProgram : p));
      } else {
        alert('Не удалось сохранить выбор.');
      }
    } catch (err) {
      alert('Ошибка соединения при выборе упражнения.');
    }
  };

  const handleWristChoice = async (choice: 'wrist_curls' | 'pronator' | 'side_pressure') => {
    if (!program) return;
    const exerciseName = choice === 'wrist_curls' 
      ? 'Скручивание на кисть' 
      : choice === 'pronator' 
        ? 'Подъем на пронатор' 
        : 'Боковое давление';

    const updatedWeeks = program.weeks.map(w => ({
      ...w,
      days: w.days.map(d => ({
        ...d,
        exercises: d.exercises.map(ex => {
          if (ex.name === "Скручивания на кисть") {
            return { ...ex, name: exerciseName };
          }
          return ex;
        })
      }))
    }));

    const updatedProgram: ProgramData = {
      ...program,
      selectedExercise: choice,
      weeks: updatedWeeks
    };

    try {
      const res = await fetch('/api/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, title: program.title, programData: updatedProgram })
      });
      if (res.ok) {
        setPrograms(prev => prev.map(p => p.title === program.title ? updatedProgram : p));
      } else {
        alert('Не удалось сохранить выбор.');
      }
    } catch (err) {
      alert('Ошибка соединения при выборе упражнения.');
    }
  };

  const handleDeleteProgram = async () => {
    if (!program) return;
    if (!window.confirm(`Вы действительно хотите завершить и полностью удалить программу "${program.title}"? Это также сотрет все её выполненные подходы.`)) return;
    try {
      const res = await fetch(`/api/program?chatId=${chatId}&title=${encodeURIComponent(program.title)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Программа удалена.');
        const remaining = programs.filter(p => p.title !== program.title);
        setPrograms(remaining);
        if (remaining.length > 0) {
          setActiveProgramTitle(remaining[0].title);
          localStorage.setItem('activeProgramTitle', remaining[0].title);
        } else {
          setActiveProgramTitle(null);
          localStorage.removeItem('activeProgramTitle');
        }
      } else {
        alert('Не удалось удалить программу.');
      }
    } catch (err) {
      alert('Ошибка при удалении программы.');
    }
  };

  const isWeekFullyCompleted = (week: Week) => {
    if (!week || !week.days) return false;
    return week.days.every(day => {
      if (!day.exercises || day.exercises.length === 0) return true;
      return day.exercises.every((ex, exIdx) => {
        const sets = getExerciseSets(ex);
        return sets.every(set => 
          isSetCompleted(week.weekIndex, day.dayName, exIdx, set.setIndex)
        );
      });
    });
  };

  const handleCompleteWeek = async (weekIndex: number) => {
    if (!program || !currentWeekObj) return;

    if (!isWeekFullyCompleted(currentWeekObj)) {
      alert(`Вы не завершили неделю ${weekIndex + 1}.`);
      return;
    }

    const completedWeeks = program.completedWeeks || [];
    if (completedWeeks.includes(weekIndex)) {
      alert(`Неделя ${weekIndex + 1} уже завершена!`);
      return;
    }

    const updatedCompletedWeeks = [...completedWeeks, weekIndex];
    const updatedProgram: ProgramData = {
      ...program,
      completedWeeks: updatedCompletedWeeks
    };

    try {
      const res = await fetch('/api/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, title: program.title, programData: updatedProgram })
      });
      if (res.ok) {
        setProgram(updatedProgram);
        alert(`Неделя ${weekIndex + 1} успешно завершена!`);
        
        await fetch('/api/complete-week', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, weekIndex: weekIndex, programTitle: program.title })
        });
      } else {
        alert('Не удалось сохранить завершение недели в БД.');
      }
    } catch (err) {
      alert('Ошибка при завершении недели.');
    }
  };

  const handleResetWeek = async (weekIndex: number) => {
    if (!program) return;
    const completedWeeks = program.completedWeeks || [];
    const updatedCompletedWeeks = completedWeeks.filter(num => num !== weekIndex);
    const updatedProgram: ProgramData = {
      ...program,
      completedWeeks: updatedCompletedWeeks
    };

    try {
      const res = await fetch('/api/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, title: program.title, programData: updatedProgram })
      });
      if (res.ok) {
        setProgram(updatedProgram);
        alert(`Завершение недели ${weekIndex + 1} сброшено.`);
      } else {
        alert('Не удалось сбросить неделю.');
      }
    } catch (err) {
      alert('Ошибка при сбросе недели.');
    }
  };

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;
    try {
      setSavingWeight(true);
      const updatedProgram = { ...program, userWeight };
      const res = await fetch('/api/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, title: program.title, programData: updatedProgram })
      });
      if (res.ok) {
        setProgram(updatedProgram);
        alert('Вес тела сохранён!');
      }
    } catch { } finally { setSavingWeight(false); }
  };

  const getVideoUrl = (path?: string) => {
    if (!path) return '';
    if (window.location.port === '5173') {
      return `http://localhost:3000${path}`;
    }
    return path;
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recMovement || !recWeight || !recReps) {
      alert('Заполните обязательные поля рекорда!');
      return;
    }
    
    try {
      setUploadingRecord(true);
      const formData = new FormData();
      formData.append('chatId', String(chatId));
      formData.append('movement', recMovement);
      formData.append('category', recCategory);
      formData.append('weight', recWeight);
      formData.append('reps', recReps);
      if (recVideoFile) {
        formData.append('video', recVideoFile);
      }
      
      const res = await fetch('/api/records', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        setRecMovement('');
        setRecWeight('');
        setRecReps('');
        setRecVideoFile(null);
        
        const fileInput = document.getElementById('record-video-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        const recsRes = await fetch(`/api/records?chatId=${chatId}`);
        if (recsRes.ok) {
          setRecords(await recsRes.json());
        }
        loadGlobalRecords();
        alert('Рекорд успешно добавлен в Зал славы!');
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при сохранении рекорда');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка соединения с сервером при добавлении рекорда');
    } finally {
      setUploadingRecord(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот рекорд?')) return;
    try {
      const res = await fetch(`/api/records/${id}?chatId=${chatId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== id));
        alert('Рекорд удалён.');
      } else {
        alert('Ошибка при удалении рекорда');
      }
    } catch (err) {
      alert('Ошибка при удалении рекорда');
    }
  };

  const handleShareRecord = async (rec: UserRecord) => {
    try {
      setSharingRecordId(rec.id);
      const res = await fetch('/api/share-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          movement: rec.movement,
          category: rec.category,
          weight: rec.weight,
          reps: rec.reps,
          onePm: rec.onePm,
          videoPath: rec.videoPath
        })
      });
      if (res.ok) {
        alert('Рекорд отправлен в чат бота!');
      } else {
        alert('Не удалось отправить рекорд.');
      }
    } catch (err) {
      alert('Ошибка при отправке.');
    } finally {
      setSharingRecordId(null);
    }
  };

  const handleLikeRecord = async (id: number) => {
    const isLiked = likedRecordIds.includes(id);
    const endpoint = isLiked ? `/api/records/${id}/unlike` : `/api/records/${id}/like`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST'
      });
      if (res.ok) {
        const nextLiked = isLiked 
          ? likedRecordIds.filter(x => x !== id) 
          : [...likedRecordIds, id];
        setLikedRecordIds(nextLiked);
        localStorage.setItem('likedRecordIds', JSON.stringify(nextLiked));
        
        const delta = isLiked ? -1 : 1;
        setGlobalRecords(prev => prev.map(r => r.id === id ? { ...r, likes: Math.max(0, (r.likes || 0) + delta) } : r));
        setRecords(prev => prev.map(r => r.id === id ? { ...r, likes: Math.max(0, (r.likes || 0) + delta) } : r));
      }
    } catch (err) {
      console.error('Ошибка лайка:', err);
    }
  };

  const currentWeekObj = program?.weeks.find(w => w.weekIndex === selectedWeek) || null;
  const currentDayObj = currentWeekObj?.days.find(d => d.dayName === selectedDay) || null;


  let completedWorkoutsCount = 0;
  let totalWorkoutsCount = 0;
  if (program && program.weeks) {
    program.weeks.forEach(w => {
      if (w.days) {
        w.days.forEach(day => {
          totalWorkoutsCount++;
          let dayFullyCompleted = true;
          if (!day.exercises || day.exercises.length === 0) {
            dayFullyCompleted = false;
          } else {
            day.exercises.forEach((ex, exIdx) => {
              const sets = getExerciseSets(ex);
              sets.forEach(set => {
                const done = isSetCompleted(w.weekIndex, day.dayName, exIdx, set.setIndex);
                if (!done) {
                  dayFullyCompleted = false;
                }
              });
            });
          }
          if (dayFullyCompleted) {
            completedWorkoutsCount++;
          }
        });
      }
    });
  }

  let programTotalTonnage = 0;
  let programCompletedSetsCount = 0;
  let programActiveDaysCount = 0;
  let totalPlannedTonnage = 0;
  let totalPlannedSetsCount = 0;

  if (program && program.weeks) {
    program.weeks.forEach(w => {
      if (w.days) {
        w.days.forEach(day => {
          let dayHasCompletedSets = false;
          day.exercises.forEach((ex, exIdx) => {
            const sets = getExerciseSets(ex);
            sets.forEach(set => {
              totalPlannedSetsCount++;
              const isPullups = program?.title?.includes('Подтягивания');
              const setTonnage = (isPullups ? userWeight + set.weight : set.weight) * set.reps;
              totalPlannedTonnage += setTonnage;

              const done = isSetCompleted(w.weekIndex, day.dayName, exIdx, set.setIndex);
              if (done) {
                programCompletedSetsCount++;
                dayHasCompletedSets = true;
                programTotalTonnage += setTonnage;
              }
            });
          });
          if (dayHasCompletedSets) {
            programActiveDaysCount++;
          }
        });
      }
    });
  }

  if (loading) return (
    <div className="app-loader">
      <div className="loader-spinner"></div>
      <p>Загрузка дневника...</p>
    </div>
  );

  if (apiError) return (
    <div className="app-error container">
      <div className="error-card">
        <span className="error-icon"></span>
        <h2>Связь потеряна</h2>
        <p>{apiError}</p>
        <button className="btn-primary" onClick={loadUserData}>Повторить</button>
      </div>
    </div>
  );

  const getHeaderSubtitle = () => {
    if (!program) return 'Нет программы';
    if (program.title === "Жим / Брусья с доп. весом" && program.selectedExercise) {
      return program.selectedExercise === 'bench' ? 'Жим штанги лёжа' : 'Отжимания на брусьях с доп.весом';
    }
    if (program.title === "Скручивание на кисть" && program.selectedExercise) {
      return program.selectedExercise === 'wrist_curls' 
        ? 'Скручивание на кисть' 
        : program.selectedExercise === 'pronator' 
          ? 'Подъем на пронатор' 
          : 'Боковое давление';
    }
    return program.title;
  };


  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="container">
          <div className="header-info">
            <span className="logo-emoji"></span>
            <div>
              <h1 className="header-title">Mentz Дневник</h1>
              <p className="header-subtitle">{getHeaderSubtitle()}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-help" onClick={() => setShowHelpModal(true)}>
              Настройки и справка
            </button>
          </div>
        </div>
      </header>

      <main className="app-content">
        <div className="container">
          {activeTab === 'workouts' && (
            <WorkoutsTab 
              programs={programs}
              activeProgramTitle={activeProgramTitle}
              setActiveProgramTitle={setActiveProgramTitle}
              program={program}
              selectedWeek={selectedWeek}
              setSelectedWeek={setSelectedWeek}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              currentWeekObj={currentWeekObj}
              currentDayObj={currentDayObj}
              hideWarmupNotice={hideWarmupNotice}
              setHideWarmupNotice={setHideWarmupNotice}
              getPostponeInfo={getPostponeInfo}
              getDayTonnage={getDayTonnage}
              getExerciseSets={getExerciseSets}
              isSetCompleted={isSetCompleted}
              toggleSetCompletion={toggleSetCompletion}
              isWeekFullyCompleted={isWeekFullyCompleted}
              handleExerciseChoice={handleExerciseChoice}
              handleWristChoice={handleWristChoice}
              handleResetWeek={handleResetWeek}
              handleCompleteWeek={handleCompleteWeek}
              setPostponeNewDay={setPostponeNewDay}
              setShowPostponeModal={setShowPostponeModal}
            />
          )}

          {activeTab === 'stats' && (
            <StatsTab 
              program={program}
              postponed={postponed}
              records={records}
              chartCategory={chartCategory}
              setChartCategory={setChartCategory}
              programTotalTonnage={programTotalTonnage}
              totalPlannedTonnage={totalPlannedTonnage}
              programCompletedSetsCount={programCompletedSetsCount}
              totalPlannedSetsCount={totalPlannedSetsCount}
              programActiveDaysCount={programActiveDaysCount}
              totalWorkoutsCount={totalWorkoutsCount}
              completedWorkoutsCount={completedWorkoutsCount}
            />
          )}

          {activeTab === 'records' && (
            <RecordsTab 
              recordsTab={recordsTab}
              setRecordsTab={setRecordsTab}
              calcWeight={calcWeight}
              setCalcWeight={setCalcWeight}
              calcReps={calcReps}
              setCalcReps={setCalcReps}
              calculateWeb1PM={calculateWeb1PM}
              program={program}
              userWeight={userWeight}
              setUserWeight={setUserWeight}
              recMovement={recMovement}
              setRecMovement={setRecMovement}
              recCategory={recCategory}
              setRecCategory={setRecCategory}
              recWeight={recWeight}
              setRecWeight={setRecWeight}
              recReps={recReps}
              setRecReps={setRecReps}
              recVideoFile={recVideoFile}
              setRecVideoFile={setRecVideoFile}
              uploadingRecord={uploadingRecord}
              handleAddRecord={handleAddRecord}
              savingWeight={savingWeight}
              handleSaveWeight={handleSaveWeight}
              records={records}
              handleDeleteRecord={handleDeleteRecord}
              handleShareRecord={handleShareRecord}
              sharingRecordId={sharingRecordId}
              likedRecordIds={likedRecordIds}
              handleLikeRecord={handleLikeRecord}
              getVideoUrl={getVideoUrl}
              loadingGlobal={loadingGlobal}
              globalRecords={globalRecords}
            />
          )}
        </div>
      </main>

      <nav className="app-nav">
        <div className="container nav-container">
          <button 
            className={`nav-item ${activeTab === 'workouts' ? 'active' : ''}`} 
            onClick={() => setActiveTab('workouts')}
          >
            Тренировки
          </button>
          <button 
            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`} 
            onClick={() => setActiveTab('stats')}
          >
            Прогресс
          </button>
          <button 
            className={`nav-item ${activeTab === 'records' ? 'active' : ''}`} 
            onClick={() => setActiveTab('records')}
          >
            Зал славы
          </button>
        </div>
      </nav>

      <RescheduleModal 
        isOpen={showPostponeModal}
        onClose={() => setShowPostponeModal(false)}
        selectedDay={selectedDay}
        selectedWeek={selectedWeek}
        postponeReason={postponeReason}
        setPostponeReason={setPostponeReason}
        postponeReasonText={postponeReasonText}
        setPostponeReasonText={setPostponeReasonText}
        postponeNewDay={postponeNewDay}
        setPostponeNewDay={setPostponeNewDay}
        onPostpone={handlePostpone}
      />

      <HelpModal 
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        program={program}
        headerSubtitle={getHeaderSubtitle()}
        onDeleteProgram={handleDeleteProgram}
      />

      <AlertModal 
        message={customAlert}
        onClose={() => setCustomAlert(null)}
      />
    </div>
  );
}