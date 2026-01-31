export const isDemoMode = (): boolean => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("demo") === "1" || process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    );
  }
  return false;
};
