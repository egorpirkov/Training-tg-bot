import React from 'react';
import type { ProgramData, Week, Day, ExerciseSet } from '../../utils/types';
import { WEEK_DAYS, reasonLabel } from '../../utils/helpers';

interface WorkoutsTabProps {
  programs: ProgramData[];
  activeProgramTitle: string | null;
  setActiveProgramTitle: (title: string | null) => void;
  program: ProgramData | null;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  currentWeekObj: Week | null;
  currentDayObj: Day | null;
  hideWarmupNotice: boolean;
  setHideWarmupNotice: (val: boolean) => void;
  
  getPostponeInfo: (weekIndex: number, dayName: string) => any;
  getDayTonnage: (week: Week, day: Day) => number;
  getExerciseSets: (ex: any) => ExerciseSet[];
  isSetCompleted: (weekIndex: number, dayName: string, exerciseIndex: number, setIndex: number) => boolean;
  toggleSetCompletion: (weekIndex: number, dayName: string, exerciseIndex: number, setIndex: number, weight: number, reps: number) => void;
  isWeekFullyCompleted: (week: Week) => boolean;
  
  handleExerciseChoice: (choice: 'bench' | 'dips') => void;
  handleWristChoice: (choice: 'wrist_curls' | 'pronator' | 'side_pressure') => void;
  handleResetWeek: (weekNum: number) => void;
  handleCompleteWeek: (weekNum: number) => void;
  setPostponeNewDay: (day: string) => void;
  setShowPostponeModal: (show: boolean) => void;
}

export const WorkoutsTab: React.FC<WorkoutsTabProps> = ({
  programs,
  activeProgramTitle,
  setActiveProgramTitle,
  program,
  selectedWeek,
  setSelectedWeek,
  selectedDay,
  setSelectedDay,
  currentWeekObj,
  currentDayObj,
  hideWarmupNotice,
  setHideWarmupNotice,
  getPostponeInfo,
  getDayTonnage,
  getExerciseSets,
  isSetCompleted,
  toggleSetCompletion,
  isWeekFullyCompleted,
  handleExerciseChoice,
  handleWristChoice,
  handleResetWeek,
  handleCompleteWeek,
  setPostponeNewDay,
  setShowPostponeModal
}) => {
  const postponeInfo = getPostponeInfo(selectedWeek, selectedDay);

  return (
    <div className="tab-workouts animate-slide">
      {programs.length > 1 && (
        <div className="programs-tabs-carousel">
          {programs.map(p => (
            <button
              key={p.title}
              className={`program-tab-btn ${activeProgramTitle === p.title ? 'active' : ''}`}
              onClick={() => {
                setActiveProgramTitle(p.title);
                localStorage.setItem('activeProgramTitle', p.title);
                if (p.weeks.length > 0) {
                  setSelectedWeek(1);
                  if (p.weeks[0].days.length > 0) {
                    setSelectedDay(p.weeks[0].days[0].dayName);
                  }
                }
              }}
            >
              {p.title === "Жим / Брусья с доп. весом" && p.selectedExercise
                ? (p.selectedExercise === 'bench' ? 'Жим лёжа' : 'Брусья')
                : p.title === "Скручивание на кисть" && p.selectedExercise
                  ? (p.selectedExercise === 'wrist_curls' ? 'Кисть' : p.selectedExercise === 'pronator' ? 'Пронатор' : 'Боковое давл.')
                  : p.title === "Подтягивания с доп. весом"
                    ? 'Подтягивания с доп. весом'
                    : p.title
              }
            </button>
          ))}
        </div>
      )}

      {program ? (
        program.title === "Жим / Брусья с доп. весом" && !program.selectedExercise ? (
          <div className="exercise-choice-card card">
            <span className="choice-emoji"></span>
            <h3>Что вы будете выполнять?</h3>
            <p>Выберите одно упражнение на всю программу тренировок. Все подходы в дневнике будут автоматически адаптированы под ваш выбор.</p>
            <div className="choice-buttons">
              <button className="btn-primary" onClick={() => handleExerciseChoice('bench')}>
                Жим штанги лёжа
              </button>
              <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => handleExerciseChoice('dips')}>
                Отжимания на брусьях
              </button>
            </div>
          </div>
        ) : program.title === "Скручивание на кисть" && !program.selectedExercise ? (
          <div className="exercise-choice-card card animate-pop">
            <span className="choice-emoji"></span>
            <h3>Какое движение вы будете тренировать?</h3>
            <p>Выберите одно движение для программы. Названия упражнений в дневнике будут адаптированы под ваш выбор.</p>
            <div className="choice-buttons">
              <button className="btn-primary" onClick={() => handleWristChoice('wrist_curls')}>
                Скручивание на кисть
              </button>
              <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => handleWristChoice('pronator')}>
                Подъем на пронатор
              </button>
              <button 
                className="btn-secondary" 
                style={{ marginTop: 10, backgroundColor: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa' }} 
                onClick={() => handleWristChoice('side_pressure')}
              >
                Боковое давление
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="weeks-carousel">
              {program.weeks.map(w => (
                <button
                  key={w.weekIndex}
                  className={`week-btn ${selectedWeek === w.weekIndex ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedWeek(w.weekIndex);
                    if (w.days.length > 0) setSelectedDay(w.days[0].dayName);
                  }}
                >
                  Неделя {w.weekIndex}
                </button>
              ))}
            </div>

            <div className="days-selector">
              {currentWeekObj?.days.map(d => {
                const pi = getPostponeInfo(selectedWeek, d.dayName);
                return (
                  <button
                    key={d.dayName}
                    className={`day-btn ${selectedDay === d.dayName ? 'active' : ''}`}
                    onClick={() => setSelectedDay(d.dayName)}
                  >
                    {d.dayName.toUpperCase()}
                    {pi && <span className="day-postponed-dot">•</span>}
                  </button>
                );
              })}
            </div>

            {program.completedWeeks?.includes(selectedWeek) ? (
              <div className="completed-week-card card animate-pop">
                <span className="completed-emoji"></span>
                <h3>Неделя {selectedWeek} завершена!</h3>
                <p className="completed-desc">
                  Вы успешно выполнили все подходы и тренировки этой недели. 
                  {selectedWeek < program.weeks.length 
                    ? ` Приступайте к Неделе ${selectedWeek + 1}!` 
                    : ' Поздравляем! Вы полностью завершили программу тренировок!'}
                </p>
                <button 
                  className="btn-reset-week" 
                  onClick={() => handleResetWeek(selectedWeek)}
                >
                  Сбросить завершение недели
                </button>
              </div>
            ) : currentDayObj ? (
              <div className="workout-card">
                <div className="workout-header">
                  <div>
                    <h2 className="workout-day-title">
                      {selectedDay.toUpperCase()} · Неделя {selectedWeek}
                    </h2>
                    {postponeInfo && (
                      <div className="postpone-badge">
                        {reasonLabel(postponeInfo.reason)}
                        {postponeInfo.reasonText && ` — ${postponeInfo.reasonText}`}
                        {' → '}{postponeInfo.newDay.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="workout-header-right">
                    <span className="workout-tonnage">
                      {getDayTonnage(currentWeekObj!, currentDayObj)} кг
                    </span>
                    <button
                      className="btn-postpone"
                      onClick={() => {
                        const nextDays = WEEK_DAYS.slice(WEEK_DAYS.indexOf(selectedDay) + 1);
                        if (nextDays.length > 0) {
                          setPostponeNewDay(nextDays[0]);
                          setShowPostponeModal(true);
                        } else {
                          alert('Переносить на этой неделе больше некуда!');
                        }
                      }}
                      title="Отложить тренировку"
                    >
                      Перенести
                    </button>
                  </div>
                </div>

                {!hideWarmupNotice && (
                  <div className="workout-warmup-notice">
                    <div className="warmup-notice-text">
                      <strong>Обязательно разомнитесь</strong> перед началом тренировки!
                    </div>
                    <button 
                      className="btn-warmup-ok" 
                      onClick={() => {
                        localStorage.setItem('hideWarmupNotice', 'true');
                        setHideWarmupNotice(true);
                      }}
                    >
                      Понятно
                    </button>
                  </div>
                )}

                <div className="exercises-list">
                  {(() => {
                    const groupedExercises: { name: string; sets: { originalExIdx: number; originalSetIdx: number; weight: number; reps: number; note?: string }[] }[] = [];
                    
                    currentDayObj.exercises.forEach((ex, exIdx) => {
                      const displayName = ex.name === "Отжимания на брусьях" ? "Отжимания на брусьях с доп.весом" : ex.name;
                      let group = groupedExercises.find(g => g.name === displayName);
                      if (!group) {
                        group = { name: displayName, sets: [] };
                        groupedExercises.push(group);
                      }
                      
                      const sets = getExerciseSets(ex);
                      sets.forEach(set => {
                        group!.sets.push({
                          originalExIdx: exIdx,
                          originalSetIdx: set.setIndex,
                          weight: set.weight,
                          reps: set.reps,
                          note: set.note
                        });
                      });
                    });
                    
                    return groupedExercises.map((group, groupIdx) => (
                      <div key={groupIdx} className="exercise-item">
                        <h3 className="exercise-name">{group.name}</h3>
                        <div className="sets-list">
                          <div className="sets-header-row">
                            <span>Подход</span>
                            <span>Вес</span>
                            <span>Повторы</span>
                            <span style={{ textAlign: 'right' }}>✓</span>
                          </div>
                          {group.sets.map((set, setIdx) => {
                            const done = isSetCompleted(selectedWeek, selectedDay, set.originalExIdx, set.originalSetIdx);
                            return (
                              <div
                                key={setIdx}
                                className={`set-row ${done ? 'completed' : ''}`}
                                onClick={() => toggleSetCompletion(selectedWeek, selectedDay, set.originalExIdx, set.originalSetIdx, set.weight, set.reps)}
                              >
                                <span className="set-num">{setIdx + 1}</span>
                                <span className="set-weight">{Math.round(set.weight * 100) / 100} кг</span>
                                <span className="set-reps">
                                  {set.reps}
                                  {set.note && <span className="set-note">{set.note}</span>}
                                </span>
                                <div className="set-checkbox-wrapper">
                                  <div className={`set-checkbox ${done ? 'checked' : ''}`}>
                                    {done && <span className="checkmark">✓</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {currentWeekObj && isWeekFullyCompleted(currentWeekObj) && (
                  <button 
                    className="btn-complete-week animate-pop" 
                    onClick={() => handleCompleteWeek(selectedWeek)}
                    style={{ marginTop: 16 }}
                  >
                    Завершить неделю {selectedWeek}
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <p>На этот день тренировок нет</p>
              </div>
            )}
          </>
        )
      ) : (
        <div className="empty-state animate-slide">
          <span className="empty-emoji"></span>
          <h2>Программа не найдена</h2>
          <p>Введи команду <b>/trainingplan</b> в боте, чтобы выбрать программу.</p>
        </div>
      )}
    </div>
  );
};
