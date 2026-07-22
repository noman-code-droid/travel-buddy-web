'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export default function Input({
  label,
  icon,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <div className="space-y-2 w-full">
      {label && <label className="label-android">{label}</label>}
      <div className={cn(
        "android-input-container",
        error && "border-[#E46767]",
        className
      )}>
        {icon && <div className="text-[#ABABAB] shrink-0">{icon}</div>}
        <input
          className="android-input"
          {...props}
        />
      </div>
      {error && <p className="text-[10px] text-[#E46767] ml-1">{error}</p>}
    </div>
  );
}
