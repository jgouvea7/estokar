'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
  title: string;
};

export function Modal({ children, onClose, title }: ModalProps) {
  const dialogId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogId}
    >
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-(--overlay)"
        onClick={onClose}
      />
      <div
        className="relative z-[80] w-full max-w-[720px] max-h-[85vh] overflow-y-auto rounded-xl bg-(--card) border-2 border-(--stroke) p-6 sm:p-8 shadow-(--elevated-shadow-strong)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h4 id={dialogId} className="text-xl font-bold tracking-tight text-(--ink)">{title}</h4>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
