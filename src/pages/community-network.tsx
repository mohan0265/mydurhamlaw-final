// src/pages/community-network.tsx
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/community',
      permanent: false,
    },
  };
};

export default function CommunityNetworkRedirect() {
  return null;
}
