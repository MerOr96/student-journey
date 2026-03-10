import React from 'react';
import clsx from 'clsx';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
}

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  hover = false,
  padding = 'md',
  className,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        paddingStyles[padding],
        hover && 'card-hover cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Card;
