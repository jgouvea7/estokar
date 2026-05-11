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
    danger: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
    info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
  };

  const iconStyles = {
    danger: 'bg-rose-50 text-rose-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl reveal-up">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconStyles[variant]}`}>
              <AlertTriangle size={24} />
            </div>
            <button 
              onClick={onClose}
              className="rounded-xl border border-slate-100 p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="mt-5">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg ${variantStyles[variant]}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
