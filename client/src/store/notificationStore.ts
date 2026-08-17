import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let toastCounter = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    const newToast = { ...toast, id, duration: toast.duration || 4000 };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, newToast.duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => set({ toasts: [] }),
}));
