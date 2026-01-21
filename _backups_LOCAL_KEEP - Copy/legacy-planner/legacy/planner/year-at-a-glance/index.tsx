import { useEffect } from 'react';

export default function Landing() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const y = Number(window.localStorage.getItem('mdl_year') || '0');
      const yr = [1,2,3,4].includes(y) ? y : 1;
      window.location.replace(`/planner/${yr}`);
    }
  }, []);
  return null;
}