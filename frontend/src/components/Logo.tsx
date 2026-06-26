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
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Premium Graduation Cap + Stylized Network SVG Logo */}
      <svg
        className={`${iconSizes[size]} text-primary-500 flex-shrink-0`}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Network connections (faint background circles) */}
        <circle cx="25" cy="50" r="4" className="fill-blue-400/30" />
        <circle cx="95" cy="80" r="5" className="fill-emerald-400/40" />
        
        {/* Graduation Cap Top (Diamond) */}
        <path
          d="M60 20L100 40L60 60L20 40L60 20Z"
          fill="url(#capTopGrad)"
          stroke="url(#capStroke)"
          strokeWidth="1.5"
        />
        
        {/* Graduation Cap Base */}
        <path
          d="M32 47V68C32 78 44.5 83 60 83C75.5 83 88 78 88 68V47L60 61L32 47Z"
          fill="url(#capBaseGrad)"
        />

        {/* Tassel */}
        <path
          d="M87.5 44V76C87.5 79.5 89.5 81 91.5 81C93.5 81 95.5 79.5 95.5 76V44"
          stroke="#0066f5"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="95.5" cy="76" r="4" fill="#0066f5" />

        {/* Stylized Network / Arrow nodes */}
        <path
          d="M20 75L35 90L70 50"
          stroke="#10b981"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="75" r="4" fill="#10b981" />
        <circle cx="35" cy="90" r="4" fill="#10b981" />
        <circle cx="70" cy="50" r="4.5" fill="#10b981" />

        <defs>
          <linearGradient id="capTopGrad" x1="20" y1="40" x2="100" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0066f5" />
            <stop offset="1" stopColor="#0052c4" />
          </linearGradient>
          <linearGradient id="capStroke" x1="20" y1="20" x2="100" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="capBaseGrad" x1="32" y1="65" x2="88" y2="65" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0a4699" />
            <stop offset="1" stopColor="#0066f5" />
          </linearGradient>
        </defs>
      </svg>

      {!iconOnly && (
        <div className="flex flex-col text-left justify-center">
          <div className={`${textSizes[size]} font-black tracking-tight leading-none`}>
            <span className={lightText ? 'text-white' : 'text-slate-900 dark:text-white'}>
              OpenLearn
            </span>
            <span className="text-primary-500">
              X
            </span>
          </div>
          {subtext && (
            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mt-1 leading-none">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
