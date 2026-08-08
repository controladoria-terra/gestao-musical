import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: <Info className="h-5 w-5 text-sky-600 flex-shrink-0" />
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-bounce-in">
      <div className={`flex items-center justify-between p-4 rounded-xl border shadow-lg ${currentStyle.bg}`}>
        <div className="flex items-center gap-3">
          {currentStyle.icon}
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-slate-400 hover:text-slate-600 rounded-md p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
