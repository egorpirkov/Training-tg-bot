import React from 'react';
import type { ProgramData, UserRecord } from '../../utils/types';
import { getCategoryLabel } from '../../utils/helpers';
import { CustomSelect } from '../CustomSelect';

interface RecordsTabProps {
  recordsTab: 'my' | 'global';
  setRecordsTab: (tab: 'my' | 'global') => void;
  calcWeight: string;
  setCalcWeight: (val: string) => void;
  calcReps: string;
  setCalcReps: (val: string) => void;
  calculateWeb1PM: () => number;
  program: ProgramData | null;
  userWeight: number;
  setUserWeight: (val: number) => void;
  recMovement: string;
  setRecMovement: (val: string) => void;
  recCategory: 'bench' | 'dips' | 'pullups' | 'other';
  setRecCategory: (val: 'bench' | 'dips' | 'pullups' | 'other') => void;
  recWeight: string;
  setRecWeight: (val: string) => void;
  recReps: string;
  setRecReps: (val: string) => void;
  recVideoFile: File | null;
  setRecVideoFile: (file: File | null) => void;
  uploadingRecord: boolean;
  handleAddRecord: (e: React.FormEvent) => void;
  savingWeight: boolean;
  handleSaveWeight: (e: React.FormEvent) => void;
  records: UserRecord[];
  handleDeleteRecord: (id: number) => void;
  handleShareRecord: (rec: UserRecord) => void;
  sharingRecordId: number | null;
  likedRecordIds: number[];
  handleLikeRecord: (id: number) => void;
  getVideoUrl: (path: string) => string;
  loadingGlobal: boolean;
  globalRecords: UserRecord[];
}

export const RecordsTab: React.FC<RecordsTabProps> = ({
  recordsTab,
  setRecordsTab,
  calcWeight,
  setCalcWeight,
  calcReps,
  setCalcReps,
  calculateWeb1PM,
  program,
  userWeight,
  setUserWeight,
  recMovement,
  setRecMovement,
  recCategory,
  setRecCategory,
  recWeight,
  setRecWeight,
  recReps,
  setRecReps,
  recVideoFile,
  setRecVideoFile,
  uploadingRecord,
  handleAddRecord,
  savingWeight,
  handleSaveWeight,
  records,
  handleDeleteRecord,
  handleShareRecord,
  sharingRecordId,
  likedRecordIds,
  handleLikeRecord,
  getVideoUrl,
  loadingGlobal,
  globalRecords
}) => {
  const isPullups = program?.title.includes('Подтягивания');
  const isDips = program?.title.includes('Брусья');
  const isWeighted = isPullups || isDips;

  return (
    <div className="tab-records animate-slide">
      <h2 className="section-title">Зал славы</h2>

      <div className="programs-tabs-carousel" style={{ marginBottom: 20 }}>
        <button
          className={`program-tab-btn ${recordsTab === 'my' ? 'active' : ''}`}
          onClick={() => setRecordsTab('my')}
        >
          Мои рекорды
        </button>
        <button
          className={`program-tab-btn ${recordsTab === 'global' ? 'active' : ''}`}
          onClick={() => setRecordsTab('global')}
        >
          Все рекорды
        </button>
      </div>

      {recordsTab === 'my' ? (
        <>
          <div className="records-section-card card">
            <h3>Калькулятор 1ПМ</h3>
            <p className="card-subtitle">Узнайте свой одноповторный максимум(для корректного результата выберите упражнение в разделе "тренировки").</p>

            <div className="calc-inputs-row">
              <div className="form-group">
                <label>Рабочий вес (кг):</label>
                <input
                  type="number"
                  placeholder="80"
                  value={calcWeight}
                  onChange={e => setCalcWeight(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Повторения:</label>
                <input
                  type="number"
                  placeholder="5"
                  min="1"
                  max="100"
                  value={calcReps}
                  onChange={e => setCalcReps(e.target.value)}
                />
              </div>
            </div>

            {calcWeight && calcReps && (() => {
              const val = calculateWeb1PM();
              return (
                <div className="calc-result-box animate-pop">
                  <div className="result-1pm">
                    <span>Расчетный 1ПМ {isWeighted ? '(доп. вес):' : ':'}</span>
                    <strong>{val} кг</strong>
                  </div>
                  {isWeighted && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'center' }}>
                      Расчёт выполнен с учётом веса тела ({userWeight} кг)
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="records-section-card card">
            <h3>Добавить новый рекорд</h3>
            <form onSubmit={handleAddRecord} className="record-form">
              <div className="form-group">
                <label>(Описание):</label>
                <input
                  type="text"
                  placeholder="Например: сделал дипсы с 40кг"
                  value={recMovement}
                  onChange={e => setRecMovement(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Категория для графика:</label>
                <CustomSelect
                  value={recCategory}
                  onChange={val => setRecCategory(val as any)}
                  options={[
                    { value: 'bench', label: 'Жим штанги лёжа' },
                    { value: 'dips', label: 'Отжимания на брусьях' },
                    { value: 'pullups', label: 'Подтягивания' },
                    { value: 'other', label: 'Другое' }
                  ]}
                />
              </div>

              <div className="calc-inputs-row">
                <div className="form-group">
                  <label>Вес (кг):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="100"
                    value={recWeight}
                    onChange={e => setRecWeight(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Повторения:</label>
                  <input
                    type="number"
                    placeholder="3"
                    value={recReps}
                    onChange={e => setRecReps(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group file-upload-group">
                <label className="file-upload-label">Видео (до 15 МБ, опционально):</label>
                <div className="custom-file-upload">
                  <label htmlFor="record-video-input" className="file-upload-btn">
                    Выбрать файл
                  </label>
                  <input
                    id="record-video-input"
                    type="file"
                    accept="video/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const sizeMB = file.size / (1024 * 1024);
                        if (sizeMB > 15) {
                          alert(`Размер видео не должен превышать 15 МБ! Ваш файл: ${sizeMB.toFixed(2)} МБ.`);
                          e.target.value = '';
                          setRecVideoFile(null);
                        } else {
                          setRecVideoFile(file);
                        }
                      } else {
                        setRecVideoFile(null);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <span className="file-name-display">
                    {recVideoFile ? recVideoFile.name : 'Файл не выбран'}
                  </span>
                </div>
              </div>

              <button type="submit" className="btn-primary btn-submit-record" disabled={uploadingRecord}>
                {uploadingRecord ? 'Сохранение рекорда...' : 'Записать рекорд'}
              </button>
            </form>
          </div>

          {program && (program.title.includes('Подтягивания') || program.title.includes('Брусья')) && (
            <form className="profile-form card" onSubmit={(e) => {
              if (userWeight < 30) {
                e.preventDefault();
                alert('Пожалуйста, укажите реальный вес (не менее 30 кг)');
                return;
              }
              handleSaveWeight(e);
            }}>
              <h3>Настройка: Вес тела атлета</h3>
              <p className="form-description">Вес тела нужен для точного расчёта тоннажа в подтягиваниях и брусьях.</p>
              <div className="form-group">
                <label htmlFor="weight-input">Вес тела (кг):</label>
                <input
                  id="weight-input"
                  type="number"
                  step="0.1"
                  value={userWeight === 0 ? '' : userWeight}
                  onChange={e => {
                    const val = e.target.value;
                    setUserWeight(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  placeholder="80"
                  required
                />
              </div>

              {userWeight > 0 && userWeight < 30 && (
                <p style={{ color: 'var(--tg-theme-destructive-text-color, #000000)', fontSize: '13px', marginTop: '-10px', marginBottom: '15px' }}>
                  Укажите реальный вес (от 30 кг)
                </p>
              )}

              <button
                type="submit"
                className="btn-primary"

                disabled={savingWeight || userWeight < 30}
              >
                {savingWeight ? 'Сохранение...' : 'Сохранить вес'}
              </button>
            </form>
          )}

          <div className="records-list-section">
            <h3>Записи в Зале славы ({records.length})</h3>
            {records.length === 0 ? (
              <div className="empty-records-state card">
                <p>Здесь пока нет ваших рекордов. Добавьте первый рекорд выше!</p>
              </div>
            ) : (
              <div className="records-grid">
                {records.map(rec => {
                  const rounded1PM = Math.round(rec.onePm * 10) / 10;
                  return (
                    <div key={rec.id} className="record-card card">
                      <div className="record-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="record-date">
                            {new Date(rec.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                          <span className="record-category-badge">
                            {getCategoryLabel(rec.category, rec.movement)}
                          </span>
                        </div>
                        <button
                          className="btn-delete-record"
                          onClick={() => handleDeleteRecord(rec.id)}
                          title="Удалить рекорд"
                        >
                          Удалить
                        </button>
                      </div>

                      <div className="record-movement-title">{rec.movement}</div>

                      <div className="record-stats-row">
                        <div className="record-stat-item">
                          <span className="label">Результат</span>
                          <span className="value">{rec.weight} кг x {rec.reps}</span>
                        </div>
                        <div className="record-stat-item">
                          <span className="label">Расчетный 1ПМ</span>
                          <span className="value highlight">~{rounded1PM} кг</span>
                        </div>
                      </div>

                      {rec.videoPath && (
                        <div className="record-video-container">
                          <video
                            className="record-video"
                            src={getVideoUrl(rec.videoPath)}
                            controls
                            playsInline
                            preload="metadata"
                          />
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          className="btn-share-record btn-secondary"
                          onClick={() => handleShareRecord(rec)}
                          disabled={sharingRecordId === rec.id}
                          style={{ flex: 1, margin: 0 }}
                        >
                          {sharingRecordId === rec.id ? 'Отправка...' : 'Похвастаться'}
                        </button>
                        <button
                          className={`btn-like-record ${likedRecordIds.includes(rec.id) ? 'liked' : ''}`}
                          onClick={() => handleLikeRecord(rec.id)}
                          style={{ flex: 1, margin: 0 }}
                        >
                          Респект {rec.likes || 0}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="global-records-section animate-slide">
          <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '16px', fontWeight: 800 }}>Лента рекордов сообщества</h3>
          {loadingGlobal ? (
            <div style={{ textAlign: 'center', padding: '45px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              <div className="loader-spinner" style={{ width: '24px', height: '24px', margin: '0 auto 12px' }}></div>
              Загрузка ленты...
            </div>
          ) : globalRecords.length === 0 ? (
            <div className="empty-records-state card" style={{ textAlign: 'center', padding: '30px' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>В ленте пока нет рекордов сообщества</p>
            </div>
          ) : (
            <div className="records-grid">
              {globalRecords.map(rec => {
                const rounded1PM = Math.round(rec.onePm * 10) / 10;
                return (
                  <div key={rec.id} className="record-card card animate-pop">
                    <div className="record-card-header">
                      <span className="record-date">
                        {new Date(rec.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                      <span className="record-category-badge">
                        {getCategoryLabel(rec.category, rec.movement)}
                      </span>
                    </div>

                    <div className="record-movement-title">{rec.movement}</div>

                    <div className="record-stats-row">
                      <div className="record-stat-item">
                        <span className="label">Результат</span>
                        <span className="value">{rec.weight} кг x {rec.reps}</span>
                      </div>
                      <div className="record-stat-item">
                        <span className="label">Расчетный 1ПМ</span>
                        <span className="value highlight">~{rounded1PM} кг</span>
                      </div>
                    </div>

                    {rec.videoPath && (
                      <div className="record-video-container">
                        <video
                          className="record-video"
                          src={getVideoUrl(rec.videoPath)}
                          controls
                          playsInline
                          preload="metadata"
                        />
                      </div>
                    )}

                    <button
                      className={`btn-like-record ${likedRecordIds.includes(rec.id) ? 'liked' : ''}`}
                      onClick={() => handleLikeRecord(rec.id)}
                    >
                      Респект {rec.likes || 0}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
