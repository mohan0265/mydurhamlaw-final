
// src/pages/yaag.tsx - Redirect to consolidated year-at-a-glance
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: { destination: "/year-at-a-glance", permanent: true },
  };
};

export default function YAAGRedirect() {
  return null;
}
