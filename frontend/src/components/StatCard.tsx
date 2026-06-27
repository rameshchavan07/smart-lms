import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Trend {
  value: number;
  positive: boolean;
  label?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;       // e.g. '#4361f0'
  bg: string;          // e.g. 'rgba(67,97,240,0.1)'
  trend?: Trend;
  linkTo?: string;
  linkLabel?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon: Icon,
  color, bg, trend, linkTo, linkLabel, loading = false,
}) => {
  if (loading) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="flex items-start gap-4">
          <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-7 w-16 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover group" style={{ padding: 20 }}>
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{ background: bg }}
        >
          <Icon size={22} color={color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <p className="text-[28px] font-black leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend.positive
                ? <TrendingUp size={13} color="#10b981" />
                : <TrendingDown size={13} color="#ef4444" />}
              <span className="text-[12px] font-bold" style={{ color: trend.positive ? '#10b981' : '#ef4444' }}>
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
              )}
            </div>
          )}
        </div>
      </div>
      {linkTo && linkLabel && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <Link
            to={linkTo}
            className="text-[12px] font-semibold transition-colors"
            style={{ color: color }}
          >
            {linkLabel} →
          </Link>
        </div>
      )}
    </div>
  );
};

export default StatCard;
