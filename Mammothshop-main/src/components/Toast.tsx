import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none">
        {items.map((item) => (
          <ToastView key={item.id} item={item} onClose={() => remove(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const config = {
    success: { icon: CheckCircle2, class: 'border-success-500 text-success-700 bg-success-50' },
    error: { icon: AlertCircle, class: 'border-error-500 text-error-700 bg-error-50' },
    info: { icon: Info, class: 'border-primary-500 text-primary-700 bg-primary-50' },
  };
  const { icon: Icon, class: cls } = config[item.type];
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg animate-slide-down bg-white ${cls}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <p className="text-sm font-500 flex-1">{item.message}</p>
      <button onClick={onClose} className="opacity-50 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
