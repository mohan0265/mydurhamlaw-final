'use client';

import { useState, useEffect } from 'react';

export type Status = 'online' | 'offline' | 'busy';

export const ringClass = (status?: Status) => {
  switch (status) {
    case 'busy':
      return 'bg-amber-500';
    case 'online':
      return 'bg-green-500';
    default:
      return 'bg-gray-500 opacity-60';
  }
};

export const computeBottomRight = () => {
  return {
    bottom: 180,
    right: 88,
  };
};

const AWYWidget = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || process.env.NEXT_PUBLIC_FEATURE_AWY !== '1') {
    return null;
  }

  return <div id="awy-root" />;
};

export default AWYWidget;