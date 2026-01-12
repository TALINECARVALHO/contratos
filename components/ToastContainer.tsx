import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const Toast: React.FC<{ toast: ToastMessage; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const isSuccess = toast.type === 'success';
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
  const icon = isSuccess ? <CheckCircle /> : <AlertTriangle />;

  return (
    <div className={`flex items-center text-white p-4 rounded-md shadow-lg mb-2 animate-fade-in-right ${bgColor}`}>
      <div className="mr-3">{icon}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button onClick={() => onRemove(toast.id)} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-24 right-4 z-[100] w-full max-w-sm">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};
