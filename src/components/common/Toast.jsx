import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export const Toast = () => {
  const { toast, closeToast } = useAdmin();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      closeToast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-surface rounded-xl shadow-modal border border-soft-gray/20 max-w-md">
      <div className="flex-shrink-0">
        {isError ? (
          <AlertCircle className="w-5 h-5 text-error" />
        ) : isInfo ? (
          <Info className="w-5 h-5 text-accent" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-success" />
        )}
      </div>
      <div className="flex-1 text-sm font-medium text-charcoal">
        {toast.message}
      </div>
      <button
        onClick={closeToast}
        className="p-1 rounded-md text-soft-gray hover:text-charcoal hover:bg-warm-ivory transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
