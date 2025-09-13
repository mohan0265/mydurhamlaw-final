import { ReactNode, forwardRef } from 'react';

interface AvatarProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ children, className = '', style }, ref) => {
    return (
      <div 
        ref={ref}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 overflow-hidden ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ src, alt, className = '' }, ref) => {
    return (
      <img 
        ref={ref}
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
);

AvatarImage.displayName = 'AvatarImage';

interface AvatarFallbackProps {
  children: ReactNode;
  className?: string;
}

export const AvatarFallback = forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ children, className = '' }, ref) => {
    return (
      <span 
        ref={ref}
        className={`flex h-full w-full items-center justify-center bg-gray-100 text-sm font-medium text-gray-600 ${className}`}
      >
        {children}
      </span>
    );
  }
);

AvatarFallback.displayName = 'AvatarFallback';