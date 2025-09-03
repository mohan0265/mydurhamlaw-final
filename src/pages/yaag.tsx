// src/pages/yaag.tsx
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: { destination: "/year-at-a-glance", permanent: false },
  };
};

export default function YAAGRedirect() {
  return null;
}
