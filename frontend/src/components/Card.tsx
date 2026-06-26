import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  clickable?: boolean;
  gradient?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  clickable = false,
  gradient = false,
  className = '',
  ...props
}) => {
  const baseStyle = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 relative overflow-hidden transition-all duration-200 shadow-sm";
  
  const hoverStyle = hover ? "hover:-translate-y-1 hover:shadow-md" : "";
  const clickableStyle = clickable ? "cursor-pointer active:scale-99" : "";
  const gradientBar = gradient ? "before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-primary-500 before:to-indigo-600" : "";

  return (
    <div
      className={`${baseStyle} ${hoverStyle} ${clickableStyle} ${gradientBar} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
