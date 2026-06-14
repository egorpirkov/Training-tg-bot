import React from 'react';
import type { ProgramData, PostponedTraining, UserRecord } from '../../utils/types';
import { reasonLabel } from '../../utils/helpers';
import { CustomSelect } from '../CustomSelect';
import { ProgressionChart } from '../ProgressionChart';

interface StatsTabProps {
  program: ProgramData | null;
  postponed: PostponedTraining[];
  records: UserRecord[];
  chartCategory: 'bench' | 'dips' | 'pullups' | 'other';
  setChartCategory: (val: 'bench' | 'dips' | 'pullups' | 'other') => void;
  
  programTotalTonnage: number;
  totalPlannedTonnage: number;
  programCompletedSetsCount: number;
  totalPlannedSetsCount: number;
  programActiveDaysCount: number;
  totalWorkoutsCount: number;
  completedWorkoutsCount: number;
}

export const StatsTab: React.FC<StatsTabProps> = ({
  program,
  postponed,
  records,
  chartCategory,
  setChartCategory,
  programTotalTonnage,
  totalPlannedTonnage,
  programCompletedSetsCount,
  totalPlannedSetsCount,
  programActiveDaysCount,
  totalWorkoutsCount,
  completedWorkoutsCount
}) => {
  const tonnagePercent = totalPlannedTonnage > 0 ? Math.min(100, (programTotalTonnage / totalPlannedTonnage) * 100) : 0;
  const setsPercent = totalPlannedSetsCount > 0 ? Math.min(100, (programCompletedSetsCount / totalPlannedSetsCount) * 100) : 0;
  const daysPercent = totalWorkoutsCount > 0 ? Math.min(100, (programActiveDaysCount / totalWorkoutsCount) * 100) : 0;

  return (
    <div className="tab-stats animate-slide">
      <h2 className="section-title">Прогресс</h2>
      <div className="stats-grid">
        <div 
          className="stat-card purple" 
          style={tonnagePercent === 100 ? { borderColor: 'rgba(16, 185, 129, 0.6)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' } : {}}
        >
          <div className="water-fill" style={{ height: `${tonnagePercent}%` }}>
            <div className="water-fill-secondary"></div>
          </div>
          <div className="stat-card-content">
            <span className="stat-icon"></span>
            <div className="stat-value">{Math.round(programTotalTonnage)} кг</div>
            <div className="stat-label">Общий тоннаж</div>
          </div>
        </div>
        
        <div 
          className="stat-card cyan" 
          style={setsPercent === 100 ? { borderColor: 'rgba(16, 185, 129, 0.6)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' } : {}}
        >
          <div className="water-fill" style={{ height: `${setsPercent}%` }}>
            <div className="water-fill-secondary"></div>
          </div>
          <div className="stat-card-content">
            <span className="stat-icon"></span>
            <div className="stat-value">{programCompletedSetsCount}</div>
            <div className="stat-label">Подходов выполнено</div>
          </div>
        </div>
        
        <div 
          className="stat-card green" 
          style={daysPercent === 100 ? { borderColor: 'rgba(16, 185, 129, 0.6)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)' } : {}}
        >
          <div className="water-fill" style={{ height: `${daysPercent}%` }}>
            <div className="water-fill-secondary"></div>
          </div>
          <div className="stat-card-content">
            <span className="stat-icon"></span>
            <div className="stat-value">{programActiveDaysCount}</div>
            <div className="stat-label">Активных дней</div>
          </div>
        </div>
      </div>

      {program && (
        <div className="progress-analysis-card">
          <h3>Прогресс программы</h3>
          <div className="progress-details">
            <span>Выполнено: {completedWorkoutsCount} силовых тренировок</span>
            <span>из {totalWorkoutsCount} тренировок</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(100, (completedWorkoutsCount / (totalWorkoutsCount || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {postponed.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Отложенные тренировки</h3>
          {postponed.map((p, i) => (
            <div key={i} className="postpone-log-item">
              <span>Неделя {p.weekIndex} · {p.dayName.toUpperCase()}</span>
              <span className="postpone-log-reason">
                {reasonLabel(p.reason)}
                {p.reasonText ? ` — ${p.reasonText}` : ''}
                {' → '}{p.newDay.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="records-section-card card" style={{ marginTop: 16 }}>
        <div className="chart-header-row">
          <h3>График прогресса 1ПМ</h3>
          <CustomSelect 
            value={chartCategory} 
            onChange={val => setChartCategory(val as any)}
            options={[
              { value: 'bench', label: 'Жим штанги лёжа' },
              { value: 'dips', label: 'Брусья' },
              { value: 'pullups', label: 'Подтягивания' },
              { value: 'other', label: 'Другое' }
            ]}
            className="chart-category-container"
          />
        </div>
        <ProgressionChart records={records} chartCategory={chartCategory} />
      </div>
    </div>
  );
};
