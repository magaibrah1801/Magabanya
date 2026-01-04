
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  'aria-label'?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  'aria-label': ariaLabel,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed rounded-lg uppercase tracking-wider";
  
  const variants = {
    primary: "bg-amber-500 text-zinc-950 hover:bg-amber-400 active:bg-amber-600 focus:ring-amber-500 shadow-[0_4px_14px_rgba(245,158,11,0.2)]",
    secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-900 focus:ring-zinc-600 border border-zinc-700",
    danger: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 focus:ring-red-600 shadow-[0_4px_14px_rgba(220,38,38,0.2)]",
    ghost: "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 active:bg-zinc-800/50"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-4 py-2 text-xs",
    lg: "px-6 py-3 text-sm"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
};
