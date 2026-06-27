import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: { label: string; color: string; bg: string };
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, badge }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
    <div className="flex-1">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {badge && (
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
            style={{ color: badge.color, background: badge.bg }}
          >
            {badge.label}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;
