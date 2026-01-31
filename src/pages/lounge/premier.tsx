"use client";
import dynamic from "next/dynamic";
import Safe from "@/components/common/Safe";
import LoungeLayout from "@/components/lounge/LoungeLayout";
import { LexiconRotatingBanner } from "@/components/lexicon/LexiconRotatingBanner";

const OnlineUsers = dynamic(() => import("@/components/lounge/OnlineUsers"), {
  ssr: false,
});
const ShoutoutsWall = dynamic(
  () => import("@/components/lounge/ShoutoutsWall"),
  { ssr: false },
);
const PublicChat = dynamic(() => import("@/components/lounge/PublicChat"), {
  ssr: false,
});
const ActivityCards = dynamic(
  () => import("@/components/lounge/ActivityCards"),
  { ssr: false },
);
const DMDrawer = dynamic(() => import("@/components/lounge/DMDrawer"), {
  ssr: false,
});
const VirtualCoffeeTable = dynamic(
  () => import("@/components/lounge/VirtualCoffeeTable"),
  { ssr: false },
);
const Icebreakers = dynamic(() => import("@/components/lounge/Icebreakers"), {
  ssr: false,
});
const LoungeFeed = dynamic(() => import("@/components/lounge/LoungeFeed"), {
  ssr: false,
});
const StudyTunes = dynamic(() => import("@/components/lounge/StudyTunes"), {
  ssr: false,
});
const NewFriendsCarousel = dynamic(
  () => import("@/components/lounge/NewFriendsCarousel"),
  { ssr: false },
);
const MoodToggle = dynamic(() => import("@/components/lounge/MoodToggle"), {
  ssr: false,
});

const user = { id: "demo-user", name: "Guest" };

export default function PremierLounge() {
  return (
    <LoungeLayout
      left={
        <>
          <Safe>
            <OnlineUsers user={user} />
          </Safe>
          <Safe>
            <NewFriendsCarousel />
          </Safe>
          <Safe>
            <ActivityCards />
          </Safe>
          <Safe>
            <MoodToggle />
          </Safe>
        </>
      }
      center={
        <>
          <Safe>
            <div className="mb-6">
              <LexiconRotatingBanner mode="auth" />
            </div>
          </Safe>
          <Safe>
            <PublicChat user={user} />
          </Safe>
          <Safe>
            <LoungeFeed />
          </Safe>
          <Safe>
            <Icebreakers onPick={() => {}} />
          </Safe>
        </>
      }
      right={
        <>
          <Safe>
            <ShoutoutsWall user={user} />
          </Safe>
          <Safe>
            <StudyTunes />
          </Safe>
          <Safe>
            <VirtualCoffeeTable />
          </Safe>
          <Safe>
            <DMDrawer open={false} onClose={() => {}} />
          </Safe>
        </>
      }
    />
  );
}
