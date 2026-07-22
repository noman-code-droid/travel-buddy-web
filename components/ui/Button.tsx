'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  loading?: boolean;
}

export default function Button({
  className,
  variant = 'primary',
  loading,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'android-btn-primary',
    secondary: 'android-btn-secondary',
    destructive: 'w-full h-[64px] bg-[#E46767] text-white font-bold rounded-[24px] text-[18px] active:scale-[0.97] flex items-center justify-center gap-3',
    ghost: 'bg-transparent text-[#ABABAB] hover:text-white transition-colors',
  };

  return (
    <button
      className={cn(
        variants[variant],
        loading && 'opacity-70 pointer-events-none',
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
