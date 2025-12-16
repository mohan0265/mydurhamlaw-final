'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ParentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/loved-one-login');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Redirecting to loved one login…
    </div>
  );
}
