import React from 'react';
import { GameType } from '@/types';
import { cn } from '@/lib/utils';

interface GameTypeBadgeProps {
  type: GameType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gameTypeLabels: Record<GameType, string> = {
  milhar: 'Milhar',
  centena: 'Centena',
  dezena: 'Dezena',
};

const gameTypeDigits: Record<GameType, number> = {
  milhar: 4,
  centena: 3,
  dezena: 2,
};

export function GameTypeBadge({ type, size = 'md', className }: GameTypeBadgeProps) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        `game-badge-${type}`,
        sizeStyles[size],
        className
      )}
    >
      <span>{gameTypeLabels[type]}</span>
      <span className="opacity-75 text-xs">({gameTypeDigits[type]}d)</span>
    </span>
  );
}
