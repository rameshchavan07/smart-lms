import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load data. Please try again.',
  onRetry,
}) => (
  <div className="card flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
      style={{ background: 'rgba(239,68,68,0.1)' }}>
      <AlertCircle size={28} color="#ef4444" />
    </div>
    <h3 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    <p className="text-[13px] mb-5 max-w-xs" style={{ color: 'var(--text-muted)' }}>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-secondary btn-sm gap-2">
        <RefreshCw size={14} /> Try Again
      </button>
    )}
  </div>
);

export default ErrorState;
