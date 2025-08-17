import React from 'react';
import Image from 'next/image';

interface DurmahLogoProps {
  variant?: 'full' | 'icon' | 'wordmark' | 'monogram';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const wordmarkSizeClasses = {
  sm: 'w-32 h-8',
  md: 'w-48 h-12',
  lg: 'w-64 h-16', 
  xl: 'w-80 h-20'
};

export const DurmahLogo: React.FC<DurmahLogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  className = '' 
}) => {
  const getLogoPath = () => {
    switch (variant) {
      case 'icon':
        return '/assets/logo/durmah-icon.svg';
      case 'wordmark':
        return '/assets/logo/durmah-wordmark.svg';
      case 'monogram':
        return '/assets/logo/durmah-monogram.svg';
      case 'full':
      default:
        return '/assets/logo/durmah-logo.svg';
    }
  };

  const getSizeClass = () => {
    if (variant === 'wordmark') {
      return wordmarkSizeClasses[size];
    }
    return sizeClasses[size];
  };

  const getAltText = () => {
    switch (variant) {
      case 'icon':
        return 'Durmah Icon';
      case 'wordmark':
        return 'Durmah - Your Legal Voice Buddy';
      case 'monogram':
        return 'Durmah Monogram';
      case 'full':
      default:
        return 'Durmah Logo';
    }
  };

  const getDimensions = () => {
    if (variant === 'wordmark') {
      const sizes = { sm: [128, 32], md: [192, 48], lg: [256, 64], xl: [320, 80] };
      return { width: sizes[size][0], height: sizes[size][1] };
    }
    const sizes = { sm: [32, 32], md: [48, 48], lg: [64, 64], xl: [96, 96] };
    return { width: sizes[size][0], height: sizes[size][1] };
  };

  const { width, height } = getDimensions();

  return (
    <Image
      src={getLogoPath()}
      alt={getAltText()}
      width={width}
      height={height}
      className={`${getSizeClass()} ${className}`}
      style={{ minWidth: 0, minHeight: 0 }}
    />
  );
};

// Export individual logo components for convenience
export const DurmahIcon: React.FC<Omit<DurmahLogoProps, 'variant'>> = (props) => (
  <DurmahLogo {...props} variant="icon" />
);

export const DurmahWordmark: React.FC<Omit<DurmahLogoProps, 'variant'>> = (props) => (
  <DurmahLogo {...props} variant="wordmark" />
);

export const DurmahMonogram: React.FC<Omit<DurmahLogoProps, 'variant'>> = (props) => (
  <DurmahLogo {...props} variant="monogram" />
);

export default DurmahLogo;