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
    <div className={`flex items-center justify-center ${className}`}>
      <img src="/logo.jpg" alt="OpenLearnX Logo" className={`${iconSizes[size]} rounded-xl object-contain bg-white`} />
    </div>
  );
};

export default Logo;
