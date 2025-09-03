import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const mockStudents = [
  { id: "user1", name: "Orla", avatar: null, joined: "1 min ago" },
  { id: "user2", name: "Sam", avatar: null, joined: "3 min ago" },
  { id: "user3", name: "Riya", avatar: null, joined: "7 min ago" },
];

const NewFriendsCarousel: React.FC = () => (
  <div className="bg-gradient-to-br from-violet-100 via-blue-100 to-sky-100 rounded-2xl shadow px-4 py-3 mb-4">
    <h3 className="font-bold text-lg mb-1">🌟 New Faces</h3>
    <div className="flex gap-4 overflow-x-auto py-1">
      {mockStudents.map(user => (
        <div key={user.id} className="flex flex-col items-center min-w-[80px]">
          <Avatar className="w-10 h-10 shadow border border-blue-200">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-xs mt-1">{user.name}</span>
          <span className="text-[10px] text-gray-400">{user.joined}</span>
        </div>
      ))}
    </div>
  </div>
);

export default NewFriendsCarousel;
