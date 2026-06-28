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
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Premium Logo Graphic */}
      <div className="relative">
        <svg
          className={`${iconSizes[size]} flex-shrink-0`}
          viewBox="0 0 120 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Digital pixels/squares on the left */}
          <rect x="12" y="32" width="6" height="6" rx="1.5" className="fill-blue-500" />
          <rect x="20" y="24" width="8" height="8" rx="2" className="fill-blue-400" />
          <rect x="14" y="44" width="5" height="5" rx="1" className="fill-cyan-400" />
          
          {/* Open Book Pages */}
          <path
            d="M60 84C46 72 24 72 24 72V44C24 44 46 44 60 56C74 44 96 44 96 44V72C96 72 74 72 60 84Z"
            fill="url(#bookPagesGrad)"
          />
          {/* Book Spine Center Line */}
          <path d="M60 56V84" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

          {/* Graduation Cap Top (Diamond) */}
          <path
            d="M60 22L98 38L60 54L22 38L60 22Z"
            fill="#091833"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Cap Base Stand */}
          <path
            d="M38 43.5V49C38 53.5 48 57 60 57C72 57 82 53.5 82 49V43.5"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Right Swoosh Curve extending to the X */}
          <path
            d="M86 46C100 46 110 32 104 22C98 12 86 28 92 36"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />

          <defs>
            <linearGradient id="bookPagesGrad" x1="24" y1="44" x2="96" y2="84" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e3a8a" />
              <stop offset="0.5" stopColor="#3b82f6" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col items-center mt-2">
          <div className={`${textSizes[size]} font-black tracking-tight leading-none flex items-center`}>
            <span className={lightText ? 'text-white' : 'text-primary'}>
              OpenLearn
            </span>
            <span className="text-[#2563eb]">
              X
            </span>
          </div>
          {subtext && (
            <span className="text-[10px] font-bold tracking-wider text-muted uppercase mt-1.5 leading-none">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
