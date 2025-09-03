import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";

import LoungeLayout from "@/components/lounge/LoungeLayout";
import OnlineUsers from "@/components/lounge/OnlineUsers";
import PublicChat from "@/components/lounge/PublicChat";
import DMDrawer from "@/components/lounge/DMDrawer";
import Icebreakers from "@/components/lounge/Icebreakers";
import MoodToggle from "@/components/lounge/MoodToggle";
import ActivityCards from "@/components/lounge/ActivityCards";
import NewFriendsCarousel from "@/components/lounge/NewFriendsCarousel";
import StudyTunes from "@/components/lounge/StudyTunes";
import VirtualCoffeeTable from "@/components/lounge/VirtualCoffeeTable";
import ShoutoutsWall from "@/components/lounge/ShoutoutsWall";


const LoungePage: React.FC = () => {
  // For DM
  const [dmUser, setDMUser] = useState<any>(null);
  const [showDM, setShowDM] = useState(false);

  // Icebreaker utility
  const [icebreaker, setIcebreaker] = useState<string | null>(null);

  const handleDM = useCallback((user: any) => {
    setDMUser(user);
    setShowDM(true);
  }, []);
  const handleCloseDM = useCallback(() => setShowDM(false), []);

  const handlePing = (user: any) => {
    // Replace with better in-app toast logic if available
    alert(`Pinged ${user.full_name} 🎉 (They’ll see a quick ping!)`);
  };

  return (
    <>
      <LoungeLayout
        left={
          <OnlineUsers
            onDM={handleDM}
            onPing={handlePing}
          />
        }
        center={
          <PublicChat onInsertIcebreaker={setIcebreaker} />
        }
        right={
          <>
            <MoodToggle />
            <Icebreakers onPick={setIcebreaker} />
            <ActivityCards />
            <NewFriendsCarousel />
<StudyTunes />
<VirtualCoffeeTable />
<ShoutoutsWall />
          </>
        }
      />
      <DMDrawer open={showDM} onClose={handleCloseDM} peer={dmUser} />
    </>
  );
};

export default LoungePage;
