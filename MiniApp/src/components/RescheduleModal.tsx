import React from 'react';
import { WEEK_DAYS, reasonLabel } from '../utils/helpers';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDay: string;
  selectedWeek: number;
  postponeReason: 'sleep' | 'fatigue' | 'other';
  setPostponeReason: (val: 'sleep' | 'fatigue' | 'other') => void;
  postponeReasonText: string;
  setPostponeReasonText: (val: string) => void;
  postponeNewDay: string;
  setPostponeNewDay: (val: string) => void;
  onPostpone: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  selectedDay,
  selectedWeek,
  postponeReason,
  setPostponeReason,
  postponeReasonText,
  setPostponeReasonText,
  postponeNewDay,
  setPostponeNewDay,
  onPostpone
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Отложить тренировку</h3>
        <p className="modal-subtitle">{selectedDay.toUpperCase()} · Неделя {selectedWeek + 1}</p>

        <div className="modal-section-label">Причина</div>
        <div className="reason-buttons">
          {(['sleep', 'fatigue', 'other'] as const).map(r => (
            <button 
              key={r} 
              className={`reason-btn ${postponeReason === r ? 'active' : ''}`} 
              onClick={() => setPostponeReason(r)}
            >
              {reasonLabel(r)}
            </button>
          ))}
        </div>

        {postponeReason === 'other' && (
          <input
            className="modal-input"
            placeholder="Укажи причину..."
            value={postponeReasonText}
            onChange={e => setPostponeReasonText(e.target.value)}
          />
        )}

        <div className="modal-section-label">Перенести на</div>
        <div className="day-picker">
          {WEEK_DAYS.slice(WEEK_DAYS.indexOf(selectedDay) + 1).map(d => (
            <button 
              key={d} 
              className={`day-pick-btn ${postponeNewDay === d ? 'active' : ''}`} 
              onClick={() => setPostponeNewDay(d)}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onPostpone}>Отложить</button>
        </div>
      </div>
    </div>
  );
};
