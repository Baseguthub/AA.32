import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastMessage } from '../context/ToastContext';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const iconColors = {
  success: "text-green-400",
  error: "text-red-400",
  info: "text-sky-400",
  warning: "text-yellow-400",
};


const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300); // Wait for exit animation
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const IconComponent = ICONS[toast.type];
  const iconColor = iconColors[toast.type];

  return (
    <div
      className={`w-full max-w-sm p-3 rounded-lg shadow-2xl flex items-start gap-3 glass-pane border border-border-color ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <IconComponent className={iconColor} size={20} />
      </div>
      <p className="flex-grow text-sm text-text-primary">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="p-1 -m-1 rounded-full hover:bg-white/10">
          <XCircle size={16} className="text-text-secondary" />
      </button>
    </div>
  );
};

export default ToastComponent;