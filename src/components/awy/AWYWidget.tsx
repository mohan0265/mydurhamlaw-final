import React, { useState, useEffect, useRef } from 'react';
import { Heart, Video, Phone, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoCallModal } from '../VideoCall';
import { useAwyPresence } from '../../hooks/useAwyPresence';

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
  const { lovedOnes, isLoading, error, addLovedOne } = useAwyPresence();

  // Load position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('awy-widget-position');
    if (savedPosition) {
      const parsed = JSON.parse(savedPosition);
      // Validate position is within bounds
      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 400;
      setPosition({
        x: Math.max(20, Math.min(parsed.x, maxX)),
        y: Math.max(20, Math.min(parsed.y, maxY))
      });
    }
  }, []);

  // Save position to localStorage
  const savePosition = (newPosition: { x: number; y: number }) => {
    localStorage.setItem('awy-widget-position', JSON.stringify(newPosition));
  };

  // Handle drag start
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

  // Handle drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Clamp to viewport bounds
        const maxX = window.innerWidth - (isExpanded ? 300 : 60);
        const maxY = window.innerHeight - (isExpanded ? 400 : 60);
        
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
    if (newLovedOneEmail.trim()) {
      try {
        await addLovedOne(newLovedOneEmail.trim(), newLovedOneRelationship.trim() || 'Friend');
        setNewLovedOneEmail('');
        setNewLovedOneRelationship('');
        setShowAddForm(false);
      } catch (error) {
        console.error('Failed to add loved one:', error);
      }
    }
  };

  const startVideoCall = (lovedOne: any) => {
    setVideoCallState({
      isOpen: true,
      lovedOneName: lovedOne.display_name || lovedOne.email,
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
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer drag-handle"
              onClick={() => setIsExpanded(true)}
            >
              <Heart size={24} className="fill-current" />
            </motion.div>
          ) : (
            // Expanded State
            <motion.div
              key="expanded"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-purple-600 text-white p-4 flex justify-between items-center drag-handle">
                <div className="flex items-center space-x-2">
                  <Heart size={20} className="fill-current" />
                  <span className="font-semibold">Always With You</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading loved ones...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4 text-red-600">
                    <p>Error loading loved ones</p>
                  </div>
                ) : lovedOnes.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">No loved ones connected yet</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <UserPlus size={16} />
                      <span>Add Loved One</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lovedOnes.map((lovedOne) => (
                      <div
                        key={lovedOne.loved_one_id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Heart size={16} className="text-purple-600" />
                            </div>
                            {lovedOne.is_online && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {lovedOne.display_name || lovedOne.email}
                            </p>
                            <p className="text-sm text-gray-500">{lovedOne.relationship}</p>
                            <p className="text-xs text-gray-400">
                              {lovedOne.is_online ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        
                        {lovedOne.is_online && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startVideoCall(lovedOne)}
                              className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                              title="Start Video Call"
                            >
                              <Video size={16} />
                            </button>
                            <button
                              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                              title="Voice Call"
                            >
                              <Phone size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <UserPlus size={16} />
                      <span>Add Another Loved One</span>
                    </button>
                  </div>
                )}

                {/* Add Loved One Form */}
                {showAddForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Add Loved One</h4>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Email address"
                        value={newLovedOneEmail}
                        onChange={(e) => setNewLovedOneEmail(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Relationship (e.g., Mom, Dad, Friend)"
                        value={newLovedOneRelationship}
                        onChange={(e) => setNewLovedOneRelationship(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddLovedOne}
                          className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
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