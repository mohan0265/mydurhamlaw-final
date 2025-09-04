"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import LoungeLayout from "@/components/lounge/LoungeLayout";

// Light dynamic imports if any widgets are heavy; otherwise regular imports are fine.
const OnlineUsers = dynamic(() => import("@/components/lounge/OnlineUsers"), { ssr: false });
const ShoutoutsWall = dynamic(() => import("@/components/lounge/ShoutoutsWall"), { ssr: false });
const PublicChat = dynamic(() => import("@/components/lounge/PublicChat"), { ssr: false });
const ActivityCards = dynamic(() => import("@/components/lounge/ActivityCards"), { ssr: false });
const DMDrawer = dynamic(() => import("@/components/lounge/DMDrawer"), { ssr: false });
const VirtualCoffeeTable = dynamic(() => import("@/components/lounge/VirtualCoffeeTable"), { ssr: false });
const Icebreakers = dynamic(() => import("@/components/lounge/Icebreakers"), { ssr: false });
const LoungeFeed = dynamic(() => import("@/components/lounge/LoungeFeed"), { ssr: false });
const StudyTunes = dynamic(() => import("@/components/lounge/StudyTunes"), { ssr: false });
const NewFriendsCarousel = dynamic(() => import("@/components/lounge/NewFriendsCarousel"), { ssr: false });
const MoodToggle = dynamic(() => import("@/components/lounge/MoodToggle"), { ssr: false });
const MiniTweetBar = dynamic(() => import("@/components/lounge/MiniTweetBar"), { ssr: false });

// TODO: replace with real auth user; safe stub for now
const demoUser = { id: "demo-user", name: "Guest" };

export default function PremierLounge() {
  return (
    <LoungeLayout
      left={
        <>
          <OnlineUsers />
          <NewFriendsCarousel />
          <ActivityCards />
          <MoodToggle />
        </>
      }
      center={
        <>
          <PublicChat />
          <LoungeFeed />
          <MiniTweetBar />
          <Icebreakers />
        </>
      }
      right={
        <>
          <ShoutoutsWall />
          <StudyTunes />
          <VirtualCoffeeTable />
          <DMDrawer />
        </>
      }
    />
  );
}