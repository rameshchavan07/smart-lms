import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtext?: string;
  lightText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md',
  subtext = '',
  lightText = false
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src="/logo.jpg" alt="OpenLearnX Logo" className={`${iconSizes[size]} rounded-xl object-contain bg-white flex-shrink-0`} />
      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight ${textSizes[size]} ${lightText ? 'text-white' : 'text-slate-900'}`}>
            OpenLearnX
          </span>
          {subtext && (
            <span className={`text-xs ${lightText ? 'text-slate-400' : 'text-slate-500'}`}>
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
