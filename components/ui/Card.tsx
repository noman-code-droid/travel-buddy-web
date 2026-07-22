'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'elevated' | 'active';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export default function Card({
  className,
  variant = 'default',
  radius = 'md',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-[#212121]',
    flat: 'bg-[#1A1A1A] border border-[#333333]',
    elevated: 'bg-[#212121] shadow-lg',
    active: 'bg-[#212121] border border-[#FFD500]/50 shadow-[0_0_20px_rgba(255,213,0,0.1)]',
  };

  const radii = {
    sm: 'rounded-sm',
    md: 'rounded-[16px]',
    lg: 'rounded-[20px]',
    xl: 'rounded-[24px]',
    '2xl': 'rounded-[28px]',
    '3xl': 'rounded-[32px]',
  };

  return (
    <div
      className={cn(
        variants[variant],
        radii[radius],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
