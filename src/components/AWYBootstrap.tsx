'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { isAWYEnabled } from '@/lib/feature-flags';

const AWYWidget = dynamic(() => import('./awy/AWYWidget'), { ssr: false });

const AWYBootstrap = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAWYEnabled()) {
    return null;
  }

  return <AWYWidget />;
};

export default AWYBootstrap;