import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotificationStore, type ToastType } from '../../store/notificationStore';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error: <AlertCircle className="w-5 h-5 text-error" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  info: <Info className="w-5 h-5 text-info" />,
};

const borderColors: Record<ToastType, string> = {
  success: 'border-l-success',
  error: 'border-l-error',
  warning: 'border-l-warning',
  info: 'border-l-info',
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className={`
              glass-strong rounded-2xl border-l-4 ${borderColors[toast.type]}
              shadow-2xl cursor-pointer relative overflow-hidden backdrop-blur-2xl
            `}
            style={{ padding: '1.25rem 1.5rem', width: '28rem' }}
            onClick={() => removeToast(toast.id)}
          >
            {/* Subtle glow effect behind the toast */}
            <div className={`absolute inset-0 opacity-5 bg-gradient-to-r from-transparent via-transparent to-white/10`} />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-text-primary tracking-wide">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm text-text-secondary mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="shrink-0 p-0.5 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
