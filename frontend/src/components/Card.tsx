import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  clickable?: boolean;
  gradient?: boolean;
  glass?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  clickable = false,
  gradient = false,
  glass = false,
  className = '',
  ...props
}) => {
  const baseStyle = "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 shadow-sm";
  
  const glassStyle = glass ? "backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-slate-800/30" : "";
  const hoverStyle = hover ? "hover:-translate-y-1 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700" : "";
  const clickableStyle = clickable ? "cursor-pointer active:scale-[0.98]" : "";
  const gradientBar = gradient ? "before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-primary-500 before:to-indigo-650" : "";

  return (
    <div
      className={`${baseStyle} ${glassStyle} ${hoverStyle} ${clickableStyle} ${gradientBar} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
