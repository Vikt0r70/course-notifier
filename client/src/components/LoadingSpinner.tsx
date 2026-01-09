import React from 'react';
import { Spinner } from './ui';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const sizeMap = {
  small: 'sm' as const,
  medium: 'lg' as const,
  large: 'xl' as const,
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', text }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Spinner size={sizeMap[size]} variant="primary" />
      {text && <p className="text-zinc-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
