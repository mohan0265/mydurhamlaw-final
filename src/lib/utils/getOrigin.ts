export const getOrigin = () => {
  return (typeof window !== 'undefined' && window.location.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';
};