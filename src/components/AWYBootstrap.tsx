'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const AWYWidget = dynamic(() => import('./awy/AWYWidget'), { ssr: false });

const AWYBootstrap = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || process.env.NEXT_PUBLIC_FEATURE_AWY !== '1') {
    return null;
  }

  return <AWYWidget />;
};

export default AWYBootstrap;