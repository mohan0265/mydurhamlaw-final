import React, { useState, useEffect } from 'react';
import { Heart, Users, Video, Settings, Shield } from 'lucide-react';

export default function AWYSettings() {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load AWY connections
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
              <Heart size={24} className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Always With You Settings</h1>
              <p className="text-gray-600">Manage your loved ones and video calling preferences</p>
            </div>
          </div>
        </div>

        {/* Built-in Video Calling Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Video size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Built-in Video Calling</h2>
              <p className="text-gray-600 mb-4">
                MyDurhamLaw now features built-in video calling! No need for external services like Zoom or Google Meet. 
                Connect directly with your loved ones through our secure, integrated video calling system.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Add loved ones by email through the AWY widget</li>
                  <li>• See when they're online in real-time</li>
                  <li>• Click the video call button to start an instant call</li>
                  <li>• Enjoy HD video, screen sharing, and chat features</li>
                  <li>• Perfect for study help and staying connected</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Shield size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Privacy & Security</h2>
              <div className="space-y-3 text-gray-600">
                <p>• All video calls are end-to-end encrypted</p>
                <p>• No call recordings are stored on our servers</p>
                <p>• Only you and your loved ones can see your online status</p>
                <p>• You control who can add you as a loved one</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Loved Ones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users size={24} className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Connected Loved Ones</h2>
          </div>
          
          <div className="text-center py-8">
            <Heart size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Use the AWY widget to add and manage your loved ones</p>
            <p className="text-gray-500 text-sm">
              The floating heart icon on your dashboard lets you add loved ones, see who's online, and start video calls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}