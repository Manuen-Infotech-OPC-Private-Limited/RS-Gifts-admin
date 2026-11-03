import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-0.5 sm:pt-1 pb-4 sm:pb-5 px-3 sm:px-5 md:px-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card - positioned right at top with minimal gap and safe bottom space */}
      <div 
        className={`relative z-10 flex flex-col w-full ${maxWidth} max-h-[calc(100vh-1.75rem)] sm:max-h-[calc(100vh-2.25rem)] rounded-2xl bg-surface text-left shadow-modal border border-soft-gray/20 overflow-hidden transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-soft-gray/15 px-6 py-2.5 bg-warm-ivory/50">
          <h3 className="text-lg font-semibold text-charcoal">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-soft-gray hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-5 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
