import React from 'react';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  danger = false
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full flex-shrink-0 ${danger ? 'bg-red-50 dark:bg-red-950/20 text-red-500' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h4>
          <p className="text-sm text-muted mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmDialog;
