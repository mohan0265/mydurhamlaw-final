export const getOrigin = () => {
  return (typeof window !== 'undefined' && window.location.origin) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';
};