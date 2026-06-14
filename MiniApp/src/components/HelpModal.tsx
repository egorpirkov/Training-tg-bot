import React from 'react';
import type { ProgramData } from '../utils/types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: ProgramData | null;
  headerSubtitle: string;
  onDeleteProgram: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  program,
  headerSubtitle,
  onDeleteProgram
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Настройки и справка</h3>
        <p className="modal-subtitle">Управление программами и руководство</p>

        <div className="help-content">
          {program && (
            <div className="help-section" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h4 style={{ color: '#f87171' }}>Завершение активной программы</h4>
              <p style={{ marginBottom: '12px' }}>Вы можете завершить программу <b>«{headerSubtitle}»</b>. Это полностью удалит её из дневника и сотрет историю завершенных подходов.</p>
              <button 
                className="btn-danger-outline" 
                onClick={() => {
                  onClose();
                  onDeleteProgram();
                }}
                style={{ width: '100%', maxWidth: '280px', display: 'flex' }}
              >
                Завершить и удалить
              </button>
            </div>
          )}

          <div className="help-section">
            <h4>Как отмечать выполненные подходы?</h4>
            <p>Просто кликните по любой строчке подхода в списке. Подход пометится зеленой галочкой, а его тоннаж автоматически запишется в статистику недели.</p>
          </div>

          <div className="help-section">
            <h4>Что такое тоннаж и как он считается?</h4>
            <p>Тоннаж — это общий объем поднятого веса. Вычисляется как: <code>Вес × Повторы</code>.</p>
            <ul>
              <li>В обычных упражнениях учитывается вес отягощения.</li>
              <li>В подтягиваниях и брусьях учитывается <strong>Вес тела + дополнительный вес</strong>.</li>
            </ul>
          </div>

          <div className="help-section">
            <h4>Зачем указывать вес тела в профиле?</h4>
            <p>Если вы выбрали программу с подтягиваниями или брусьями, укажите ваш точный вес во вкладке <strong>«Профиль»</strong>. Без этого расчет недельного объема будет неточным!</p>
          </div>

          <div className="help-section">
            <h4>Как отложить тренировку на другой день?</h4>
            <p>Нажмите кнопку <code>Перенести</code> рядом с тоннажем дня в шапке тренировки, выберите причину (усталость, недосып) и новый день недели. В списке дней появится оранжевая точка переноса.</p>
          </div>

          <div className="help-section">
            <h4>Где смотреть результаты?</h4>
            <p>Во вкладке <strong>«Прогресс»</strong> доступен общий недельный тоннаж, количество завершенных подходов, а также визуальный прогресс-бар прохождения текущей программы тренировок.</p>
          </div>
        </div>

        <button className="btn-primary" onClick={onClose}>Понятно</button>
      </div>
    </div>
  );
};
