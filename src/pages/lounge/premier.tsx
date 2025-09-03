import React from "react";
import ActivityCards from "@/components/lounge/ActivityCards";
import DMDrawer from "@/components/lounge/DMDrawer";
import OnlineUsers from "@/components/lounge/OnlineUsers";
import PublicChat from "@/components/lounge/PublicChat";
import VirtualCoffeeTable from "@/components/lounge/VirtualCoffeeTable";
import ShoutoutsWall from "@/components/lounge/ShoutoutsWall";
import Icebreakers from "@/components/lounge/Icebreakers";
import StudyTunes from "@/components/lounge/StudyTunes";
import NewFriendsCarousel from "@/components/lounge/NewFriendsCarousel";
import MoodToggle from "@/components/lounge/MoodToggle";
import MiniTweetBar from "@/components/lounge/MiniTweetBar";
// ...add others as needed

export default function PremierLounge() {
  return (
    <div>
      <h1>🏛️ Premier Student Lounge</h1>
      <NewFriendsCarousel />
      <OnlineUsers />
      <PublicChat />
      <DMDrawer />
      <ActivityCards />
      <Icebreakers />
      <MoodToggle />
      <MiniTweetBar />
      <VirtualCoffeeTable />
      <ShoutoutsWall />
      <StudyTunes />
      {/* Add layout and styling as needed */}
    </div>
  );
}
