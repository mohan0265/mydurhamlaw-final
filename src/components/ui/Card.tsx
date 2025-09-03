// Lowercase shim for case-sensitive filesystems
export { Card, CardHeader, CardTitle, CardContent } from "./Card";

// Missing components from Card.tsx, adding here
import { ReactNode } from 'react';

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-gray-600 text-sm ${className}`}>
      {children}
    </p>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}