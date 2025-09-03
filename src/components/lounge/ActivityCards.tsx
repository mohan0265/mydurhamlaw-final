import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ActivityCard {
  id: string;
  title: string;
  description: string;
  time: string;
  participants: number;
  image?: string;
}

const mockActivities: ActivityCard[] = [
  {
    id: '1',
    title: 'Study Group - Contract Law',
    description: 'Discussing case studies for upcoming exam',
    time: '2 hours ago',
    participants: 5
  },
  {
    id: '2',
    title: 'Legal Writing Workshop',
    description: 'Collaborative essay writing session',
    time: '4 hours ago',
    participants: 8
  }
];

export default function ActivityCards() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>
                  {activity.title.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">{activity.title}</h4>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time} · {activity.participants} participants</p>
              </div>
              <Button variant="outline" size="sm">
                Join
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
