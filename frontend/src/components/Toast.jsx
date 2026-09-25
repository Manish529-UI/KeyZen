import { CheckCircle, XCircle, Info } from 'lucide-react';

function Toast({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          onClick={() => onRemove(toast.id)}
        >
          <span className="toast-icon">{icons[toast.type] || icons.info}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

export default Toast;
