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
  const hoverStyle = hover ? 'card-hover' : '';
  const clickableStyle = clickable ? 'cursor-pointer active:scale-[0.99]' : '';
  const glassStyle = glass ? 'glass' : 'card';
  const gradientStyle = gradient ? 'before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-brand-500 before:to-accent-500' : '';

  return (
    <div
      className={`${glassStyle} ${hoverStyle} ${clickableStyle} ${gradientStyle} relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
