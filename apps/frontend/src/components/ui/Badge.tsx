import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  icon: string;
  title: string;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: {
    container: 'w-12 h-12',
    icon: 'text-lg',
    title: 'text-xs',
  },
  md: {
    container: 'w-16 h-16',
    icon: 'text-2xl',
    title: 'text-xs',
  },
  lg: {
    container: 'w-20 h-20',
    icon: 'text-3xl',
    title: 'text-sm',
  },
};

export function Badge({
  icon,
  title,
  earned = true,
  size = 'md',
  className,
}: BadgeProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-1',
        className,
      )}
    >
      <div
        className={clsx(
          'flex items-center justify-center rounded-full border-2 transition-all duration-300',
          styles.container,
          earned
            ? 'border-secondary-400 bg-secondary-50 shadow-md badge-pulse'
            : 'border-gray-300 bg-gray-100 opacity-50 grayscale',
        )}
      >
        <span className={styles.icon} role="img" aria-label={title}>
          {icon}
        </span>
      </div>
      <span
        className={clsx(
          'text-center font-medium leading-tight',
          styles.title,
          earned ? 'text-gray-800' : 'text-gray-400',
        )}
      >
        {title}
      </span>
    </div>
  );
}

export default Badge;
