import React from 'react';
import LoungeLayout from '@/components/lounge/LoungeLayout';
import OnlineUsers from '@/components/lounge/OnlineUsers';
import PublicChat from '@/components/lounge/PublicChat';
import ShoutoutsWall from '@/components/lounge/ShoutoutsWall';
import ActivityCards from '@/components/lounge/ActivityCards';
import DMDrawer from '@/components/lounge/DMDrawer';
import VirtualCoffeeTable from '@/components/lounge/VirtualCoffeeTable';
import Icebreakers from '@/components/lounge/Icebreakers';
import StudyTunes from '@/components/lounge/StudyTunes';
import NewFriendsCarousel from '@/components/lounge/NewFriendsCarousel';
import MoodToggle from '@/components/lounge/MoodToggle';
import MiniTweetBar from '@/components/lounge/MiniTweetBar';

export default function PremierLounge() {
  return (
    <LoungeLayout
      left={<OnlineUsers />}
      center={<PublicChat />}
      right={<ShoutoutsWall />}
    />
  );
}
