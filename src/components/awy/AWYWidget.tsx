import React, { useState, useEffect, useRef } from 'react';
import { Heart, Video, Phone, UserPlus, X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoCallModal } from '../VideoCall/VideoCallModal';

interface LovedOne {
  loved_one_id: string;
  email?: string;
  display_name?: string;
  relationship: string;
  is_online?: boolean;
  last_seen?: string;
}

interface AWYWidgetProps {
  className?: string;
}

export const AWYWidget: React.FC<AWYWidgetProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLovedOneEmail, setNewLovedOneEmail] = useState('');
  const [newLovedOneRelationship, setNewLovedOneRelationship] = useState('');
  const [lovedOnes, setLovedOnes] = useState<LovedOne[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoCallState, setVideoCallState] = useState<{
    isOpen: boolean;
    lovedOneName: string;
    lovedOneId: string;
    isInitiator: boolean;
  }>({
    isOpen: false,
    lovedOneName: '',
    lovedOneId: '',
    isInitiator: false
  });

  const widgetRef = useRef<HTMLDivElement>(null);

  // Load position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('awy-widget-position');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        const maxX = window.innerWidth - 320;
        const maxY = window.innerHeight - 450;
        setPosition({
          x: Math.max(20, Math.min(parsed.x, maxX)),
          y: Math.max(20, Math.min(parsed.y, maxY))
        });
      } catch (e) {
        console.error('Error loading position:', e);
      }
    }
  }, []);

  // Mock data for testing - replace with real Supabase calls later
  useEffect(() => {
    // Simulate loading loved ones
    const mockLovedOnes: LovedOne[] = [
      {
        loved_one_id: '1',
        email: 'mum@example.com',
        display_name: 'Mum',
        relationship: 'Mother',
        is_online: Math.random() > 0.5, // Random online status for demo
        last_seen: new Date().toISOString()
      },
      {
        loved_one_id: '2',
        email: 'dad@example.com',
        display_name: 'Dad',
        relationship: 'Father',
        is_online: Math.random() > 0.5,
        last_seen: new Date().toISOString()
      }
    ];
    
    setLovedOnes(mockLovedOnes);
  }, []);

  const savePosition = (newPosition: { x: number; y: number }) => {
    try {
      localStorage.setItem('awy-widget-position', JSON.stringify(newPosition));
    } catch (e) {
      console.error('Error saving position:', e);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === widgetRef.current || (e.target as Element).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = widgetRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - (isExpanded ? 320 : 60);
        const maxY = window.innerHeight - (isExpanded ? 450 : 60);
        
        const clampedPosition = {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        };
        
        setPosition(clampedPosition);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        savePosition(position);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position, isExpanded]);

  const handleAddLovedOne = async () => {
    if (!newLovedOneEmail.trim()) return;

    setIsLoading(true);
    try {
      // TODO: Replace with actual Supabase RPC call
      console.log('Adding loved one:', newLovedOneEmail, newLovedOneRelationship);
      
      // For now, add to mock data
      const newLovedOne: LovedOne = {
        loved_one_id: Date.now().toString(),
        email: newLovedOneEmail.trim(),
        display_name: newLovedOneRelationship.trim() || 'Friend',
        relationship: newLovedOneRelationship.trim() || 'Friend',
        is_online: Math.random() > 0.5,
        last_seen: new Date().toISOString()
      };
      
      setLovedOnes(prev => [...prev, newLovedOne]);
      setNewLovedOneEmail('');
      setNewLovedOneRelationship('');
      setShowAddForm(false);
      
      alert('Loved one added successfully! (This is a demo - will connect to database later)');
    } catch (error) {
      console.error('Failed to add loved one:', error);
      alert('Failed to add loved one. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startVideoCall = (lovedOne: LovedOne) => {
    setVideoCallState({
      isOpen: true,
      lovedOneName: lovedOne.display_name || lovedOne.relationship,
      lovedOneId: lovedOne.loved_one_id,
      isInitiator: true
    });
  };

  const closeVideoCall = () => {
    setVideoCallState({
      isOpen: false,
      lovedOneName: '',
      lovedOneId: '',
      isInitiator: false
    });
  };

  const sendWave = (lovedOneId: string) => {
    alert('👋 Wave sent! (This is a demo - will connect to database later)');
  };

  return (
    <>
      <motion.div
        ref={widgetRef}
        className={`fixed z-50 ${className}`}
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <AnimatePresence>
          {!isExpanded ? (
            // Collapsed State
            <motion.div
              key="collapsed"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative"
            >
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-xl transition-all duration-300 cursor-pointer drag-handle transform hover:scale-110"
                onClick={() => setIsExpanded(true)}
              >
                <Heart size={28} className="fill-current animate-pulse" />
              </div>
              
              {/* Online indicator */}
              {lovedOnes.some(l => l.is_online) && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {lovedOnes.filter(l => l.is_online).length}
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            // Expanded State
            <motion.div
              key="expanded"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 max-h-[500px] overflow-hidden backdrop-blur-sm"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex justify-between items-center drag-handle">
                <div className="flex items-center space-x-3">
                  <Heart size={24} className="fill-current animate-pulse" />
                  <div>
                    <span className="font-bold text-lg">Always With You</span>
                    <p className="text-xs opacity-90">
                      {lovedOnes.filter(l => l.is_online).length} online
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open('/settings/awy', '_blank')}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    title="Settings"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-3 font-medium">Loading loved ones...</p>
                  </div>
                ) : lovedOnes.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4 font-medium">No loved ones connected yet</p>
                    <p className="text-gray-500 text-sm mb-6">Add family and friends to stay connected during your studies</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2 mx-auto transform hover:scale-105 shadow-lg"
                    >
                      <UserPlus size={18} />
                      <span className="font-medium">Add Loved One</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lovedOnes.map((lovedOne) => (
                      <div
                        key={lovedOne.loved_one_id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                              <Heart size={20} className="text-purple-600" />
                            </div>
                            {lovedOne.is_online ? (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                            ) : (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {lovedOne.display_name || lovedOne.relationship}
                            </p>
                            <p className="text-sm text-gray-600">{lovedOne.relationship}</p>
                            <p className="text-xs font-medium">
                              {lovedOne.is_online ? (
                                <span className="text-green-600">● Online now</span>
                              ) : (
                                <span className="text-gray-500">○ Offline</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          {lovedOne.is_online ? (
                            <>
                              <button
                                onClick={() => startVideoCall(lovedOne)}
                                className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
                                title="Start Video Call"
                              >
                                <Video size={16} />
                              </button>
                              <button
                                onClick={() => sendWave(lovedOne.loved_one_id)}
                                className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
                                title="Send Wave"
                              >
                                👋
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => sendWave(lovedOne.loved_one_id)}
                              className="p-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-full hover:from-gray-500 hover:to-gray-600 transition-all duration-300 shadow-lg"
                              title="Send Wave (they'll see when online)"
                            >
                              👋
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg"
                    >
                      <UserPlus size={18} />
                      <span className="font-medium">Add Another Loved One</span>
                    </button>
                  </div>
                )}

                {/* Add Loved One Form */}
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                  >
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <UserPlus size={18} className="text-purple-600" />
                      <span>Add Loved One</span>
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Email address"
                        value={newLovedOneEmail}
                        onChange={(e) => setNewLovedOneEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                      <input
                        type="text"
                        placeholder="Relationship (e.g., Mom, Dad, Friend)"
                        value={newLovedOneRelationship}
                        onChange={(e) => setNewLovedOneRelationship(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddLovedOne}
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 font-medium transform hover:scale-105 shadow-lg"
                        >
                          {isLoading ? 'Adding...' : 'Add'}
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 transition-all duration-300 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={videoCallState.isOpen}
        onClose={closeVideoCall}
        lovedOneName={videoCallState.lovedOneName}
        lovedOneId={videoCallState.lovedOneId}
        isInitiator={videoCallState.isInitiator}
      />
    </>
  );
};