import React from 'react';
import { cn } from './utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  alt?: string;
  fallback?: string;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  className,
  size = 'md',
  src,
  alt,
  fallback,
  ...props
}) => {
  const initials = fallback
    ? fallback.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (src) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden bg-zinc-800',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500',
        'flex items-center justify-center text-white font-semibold',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {initials}
    </div>
  );
};

export default Avatar;
