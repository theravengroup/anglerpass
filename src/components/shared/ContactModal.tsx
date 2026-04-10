'use client';

import { useEffect, useCallback, type ReactNode } from 'react';

export default function ContactModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-forest-deep/90 backdrop-blur-sm p-4 animate-[fadeIn_0.25s_ease_both]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-[540px] max-h-[80vh] bg-parchment border border-parchment rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)_both]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 size-10 rounded-full bg-black/[0.04] border border-parchment cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-black/[0.08] hover:scale-[1.08] z-10 text-text-secondary"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h2 className="font-heading text-2xl font-semibold text-forest-deep px-8 pt-8 tracking-[-0.3px]">
          {title}
        </h2>
        <div className="px-8 pt-5 pb-8 overflow-y-auto max-h-[calc(80vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
