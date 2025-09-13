import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const useScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    // Scroll immediately on route change
    scrollToTop();

    // And again after DOM paint to fix late-content shifting bug
    const timeout = setTimeout(scrollToTop, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);
};
