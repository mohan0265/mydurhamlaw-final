'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, Phone, Video, VideoOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { VideoCallSession } from '@/lib/types/alwaysWithYou'

interface VideoCallModalProps {
  session: VideoCallSession | null
  onClose: () => void
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  onEndCall: () => void
  onToggleCamera: () => void
  onToggleMicrophone: () => void
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  session,
  onClose,
  localStream,
  remoteStream,
  onEndCall,
  onToggleCamera,
  onToggleMicrophone
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVolumeOn, setIsVolumeOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [callStartTime] = useState(Date.now())

  // Update call duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [callStartTime])

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const handleToggleCamera = () => {
    onToggleCamera()
    setIsCameraOn(!isCameraOn)
  }

  const handleToggleMicrophone = () => {
    onToggleMicrophone()
    setIsMicOn(!isMicOn)
  }

  const handleToggleVolume = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted
      setIsVolumeOn(!isVolumeOn)
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndCall = () => {
    onEndCall()
    onClose()
  }

  if (!session) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Video Call
            </h2>
            <p className="text-sm text-gray-600">
              {formatDuration(callDuration)} • {session.status}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video area */}
        <div className="flex-1 relative bg-gray-900">
          
          {/* Remote video (main) */}
          <div className="w-full h-full flex items-center justify-center">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={!isVolumeOn}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-white text-center">
                <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-16 h-16" />
                </div>
                <p className="text-lg">Waiting for video...</p>
                <p className="text-sm text-gray-400 mt-2">
                  {session.status === 'ringing' ? 'Calling...' : 'Connecting...'}
                </p>
              </div>
            )}
          </div>

          {/* Local video (picture-in-picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
                style={{ transform: 'scaleX(-1)' }} // Mirror local video
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <VideoOff className="w-8 h-8" />
              </div>
            )}
            
            {/* Local video status indicators */}
            <div className="absolute bottom-2 left-2 flex space-x-1">
              {!isCameraOn && (
                <div className="bg-red-500 text-white p-1 rounded">
                  <VideoOff className="w-3 h-3" />
                </div>
              )}
              {!isMicOn && (
                <div className="bg-red-500 text-white p-1 rounded">
                  <MicOff className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>

          {/* Call status overlay */}
          {session.status === 'ringing' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-pulse mb-4">
                  <Phone className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Calling...</h3>
                <p className="text-gray-300">Waiting for your loved one to answer</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center space-x-4">
            
            {/* Toggle Camera */}
            <button
              onClick={handleToggleCamera}
              className={`p-4 rounded-full transition-colors ${
                isCameraOn 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
              title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            {/* Toggle Microphone */}
            <button
              onClick={handleToggleMicrophone}
              className={`p-4 rounded-full transition-colors ${
                isMicOn 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
              title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            {/* Toggle Volume */}
            <button
              onClick={handleToggleVolume}
              className={`p-4 rounded-full transition-colors ${
                isVolumeOn 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
              title={isVolumeOn ? 'Mute audio' : 'Unmute audio'}
            >
              {isVolumeOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors ml-8"
              title="End call"
            >
              <Phone className="w-6 h-6 transform rotate-135" />
            </button>
          </div>

          {/* Call info */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Duration: {formatDuration(callDuration)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCallModal