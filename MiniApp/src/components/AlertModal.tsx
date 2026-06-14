import React from 'react';

interface AlertModalProps {
  message: string | null;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="modal-overlay alert-overlay" onClick={onClose}>
      <div className="modal-card alert-modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Уведомление</h3>
        <p className="modal-subtitle" style={{ fontSize: '15px', color: '#fff', margin: '16px 0 24px', lineHeight: 1.4, textAlign: 'center' }}>
          {message}
        </p>
        <button className="btn-primary" style={{ width: '100%' }} onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};
