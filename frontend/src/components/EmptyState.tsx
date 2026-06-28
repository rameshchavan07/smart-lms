import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-surface/40 rounded-xl border border-dashed border-border w-full">
      {/* SVG Illustration */}
      <div className="mb-6 relative flex items-center justify-center">
        <svg className="w-40 h-40 text-brand-500/10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" className="fill-current" />
          <circle cx="100" cy="100" r="60" className="fill-brand-500/20" />
          <circle cx="100" cy="100" r="40" className="fill-brand-500/30" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 text-brand-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            {icon}
          </div>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-sm mb-6 leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
