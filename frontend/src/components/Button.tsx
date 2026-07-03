import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-xl text-sm transition-all duration-200 active:scale-[0.97] cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 py-2.5 px-4.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2";

  const variants = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md border border-primary-600/10",
    secondary: "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm hover:shadow-md",
    danger: "bg-danger hover:bg-red-600 text-white shadow-sm hover:shadow-md border border-red-700/10",
    ghost: "text-slate-605 dark:text-slate-355 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white",
  };

  const sizes = {
    sm: "py-1.5 px-3 text-xs",
    md: "py-2.5 px-4.5 text-sm",
    lg: "py-3 px-6 text-base",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
