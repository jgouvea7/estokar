"use client";

import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-(--critical) text-white hover:brightness-125',
    warning: 'bg-(--accent) text-white hover:brightness-125',
    info: 'bg-(--ink) text-(--card) hover:brightness-125',
  };

  const iconStyles = {
    danger: 'bg-(--critical-soft) text-(--critical)',
    warning: 'bg-(--accent-soft) text-(--accent)',
    info: 'bg-(--soft) text-(--ink)',
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-(--overlay)"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border-2 border-(--stroke) bg-(--card) reveal-up">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyles[variant]}`}>
              <AlertTriangle size={22} />
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border-2 border-(--stroke) p-1.5 text-(--muted) transition-colors hover:bg-(--soft)"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-5">
            <h3 className="text-lg font-bold text-(--ink)">{title}</h3>
            <p className="mt-2 text-sm font-medium text-(--muted) leading-relaxed">
              {description}
            </p>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border-2 border-(--stroke) px-4 py-2.5 text-xs font-bold text-(--muted) transition-all hover:bg-(--soft) disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 ${variantStyles[variant]}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--card)/30 border-t-(--card)" />
                  <span>Processando...</span>
                </div>
              ) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
