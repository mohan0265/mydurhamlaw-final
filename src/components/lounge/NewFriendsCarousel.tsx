import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ProfilePicturePreview';
import { Button } from '@/components/ui/Button';
import { Plus, MessageCircle } from 'lucide-react';

interface Friend {
  id: number;
  name: string;
  avatar: string;
  mutualFriends: number;
  isOnline: boolean;
}

const mockFriends: Friend[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    avatar: '/avatars/sarah.jpg',
    mutualFriends: 12,
    isOnline: true,
  },
  {
    id: 2,
    name: 'Mike Johnson',
    avatar: '/avatars/mike.jpg',
    mutualFriends: 8,
    isOnline: false,
  },
  {
    id: 3,
    name: 'Emily Davis',
    avatar: '/avatars/emily.jpg',
    mutualFriends: 15,
    isOnline: true,
  },
  {
    id: 4,
    name: 'Alex Kim',
    avatar: '/avatars/alex.jpg',
    mutualFriends: 6,
    isOnline: true,
  },
];

export default function NewFriendsCarousel() {
  return (
    <Card className="bg-white border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">People You May Know</h3>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            See All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockFriends.map((friend) => (
            <div key={friend.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={friend.avatar} alt={friend.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {friend.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {friend.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{friend.name}</p>
                <p className="text-xs text-gray-500">{friend.mutualFriends} mutual friends</p>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}