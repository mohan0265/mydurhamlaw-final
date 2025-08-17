/**
 * Voice Debug Page - Test TTS, STT, and Chat APIs
 * Provides traffic light indicators for system health
 */

import { useState, useRef } from 'react';
import Head from 'next/head';
import { Button } from '../components/ui/Button';

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function VoiceDebugPage() {
  const [ttsResult, setTtsResult] = useState<TestResult>({ status: 'idle', message: 'Ready to test' });
  const [sttResult, setSttResult] = useState<TestResult>({ status: 'idle', message: 'Ready to test' });
  const [chatResult, setChatResult] = useState<TestResult>({ status: 'idle', message: 'Ready to test' });
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Test TTS API
  const testTTS = async () => {
    setTtsResult({ status: 'testing', message: 'Testing TTS...' });
    
    try {
      const testText = 'Hello, this is Durmah testing text-to-speech functionality.';
      const response = await fetch(`/api/voice/tts?text=${encodeURIComponent(testText)}`);
      
      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      // Play audio
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }

      setTtsResult({ 
        status: 'success', 
        message: 'TTS working - Audio played successfully',
        details: `Response size: ${audioBlob.size} bytes`
      });
      
    } catch (error) {
      setTtsResult({ 
        status: 'error', 
        message: 'TTS failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Test STT API
  const testSTT = async () => {
    setSttResult({ status: 'testing', message: 'Starting audio recording...' });
    
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'test-recording.webm');

          const response = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`STT API error: ${response.status}`);
          }

          const data = await response.json();
          setSttResult({ 
            status: 'success', 
            message: `STT working - Transcription: "${data.text}"`,
            details: `Audio size: ${audioBlob.size} bytes`
          });
          
        } catch (error) {
          setSttResult({ 
            status: 'error', 
            message: 'STT transcription failed',
            details: error instanceof Error ? error.message : String(error)
          });
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setSttResult({ status: 'testing', message: 'Recording... Say something for 3 seconds' });

      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setSttResult({ status: 'testing', message: 'Processing transcription...' });
        }
      }, 3000);

    } catch (error) {
      setSttResult({ 
        status: 'error', 
        message: 'STT setup failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Test Chat API
  const testChat = async () => {
    setChatResult({ status: 'testing', message: 'Testing chat API...' });
    
    try {
      const testSessionId = 'debug-session-' + Date.now();
      const testMessages = [
        { role: 'user' as const, content: 'Hello Durmah, please respond with a short test message.' }
      ];

      const response = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          messages: testMessages
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      setChatResult({ 
        status: 'success', 
        message: `Chat working - Response: "${data.text.substring(0, 100)}..."`,
        details: `Full response: ${data.text}`
      });
      
    } catch (error) {
      setChatResult({ 
        status: 'error', 
        message: 'Chat API failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Traffic light component
  const TrafficLight = ({ result }: { result: TestResult }) => {
    const getColor = () => {
      switch (result.status) {
        case 'success': return 'bg-green-500';
        case 'error': return 'bg-red-500';
        case 'testing': return 'bg-yellow-500 animate-pulse';
        default: return 'bg-gray-300';
      }
    };

    return (
      <div className={`w-4 h-4 rounded-full ${getColor()}`} />
    );
  };

  const runAllTests = async () => {
    await testTTS();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testSTT();
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    await testChat();
  };

  return (
    <>
      <Head>
        <title>Voice Debug - Durmah System Test</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Durmah Voice System Debug</h1>
            <p className="text-gray-600">Test TTS, STT, and Chat APIs with traffic light status indicators</p>
            
            <div className="mt-4">
              <Button onClick={runAllTests} className="bg-purple-600 hover:bg-purple-700">
                🧪 Run All Tests
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* TTS Test Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">🔊 Text-to-Speech</h2>
                <TrafficLight result={ttsResult} />
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Tests /api/voice/tts endpoint</p>
                <div className="text-sm">
                  <div className={`p-2 rounded ${
                    ttsResult.status === 'success' ? 'bg-green-50 text-green-800' :
                    ttsResult.status === 'error' ? 'bg-red-50 text-red-800' :
                    ttsResult.status === 'testing' ? 'bg-yellow-50 text-yellow-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {ttsResult.message}
                  </div>
                  {ttsResult.details && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      {ttsResult.details}
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={testTTS} 
                disabled={ttsResult.status === 'testing'}
                className="w-full"
              >
                {ttsResult.status === 'testing' ? 'Testing...' : 'Test TTS'}
              </Button>

              <audio ref={audioRef} className="w-full mt-2" controls />
            </div>

            {/* STT Test Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">🎤 Speech-to-Text</h2>
                <TrafficLight result={sttResult} />
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Tests /api/voice/transcribe endpoint</p>
                <div className="text-sm">
                  <div className={`p-2 rounded ${
                    sttResult.status === 'success' ? 'bg-green-50 text-green-800' :
                    sttResult.status === 'error' ? 'bg-red-50 text-red-800' :
                    sttResult.status === 'testing' ? 'bg-yellow-50 text-yellow-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {sttResult.message}
                  </div>
                  {sttResult.details && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      {sttResult.details}
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={testSTT} 
                disabled={sttResult.status === 'testing'}
                className="w-full"
              >
                {sttResult.status === 'testing' ? 'Recording...' : 'Test STT (3s)'}
              </Button>
            </div>

            {/* Chat Test Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">💬 Chat API</h2>
                <TrafficLight result={chatResult} />
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Tests /api/voice/chat endpoint</p>
                <div className="text-sm">
                  <div className={`p-2 rounded ${
                    chatResult.status === 'success' ? 'bg-green-50 text-green-800' :
                    chatResult.status === 'error' ? 'bg-red-50 text-red-800' :
                    chatResult.status === 'testing' ? 'bg-yellow-50 text-yellow-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {chatResult.message}
                  </div>
                  {chatResult.details && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 max-h-20 overflow-y-auto">
                      {chatResult.details}
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={testChat} 
                disabled={chatResult.status === 'testing'}
                className="w-full"
              >
                {chatResult.status === 'testing' ? 'Testing...' : 'Test Chat'}
              </Button>
            </div>
          </div>

          {/* System Status Summary */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🚦 System Status</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <TrafficLight result={ttsResult} />
                <p className="text-sm mt-1">TTS</p>
              </div>
              <div className="text-center">
                <TrafficLight result={sttResult} />
                <p className="text-sm mt-1">STT</p>
              </div>
              <div className="text-center">
                <TrafficLight result={chatResult} />
                <p className="text-sm mt-1">Chat</p>
              </div>
            </div>
          </div>

          {/* Environment Info */}
          <div className="mt-6 bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Environment Check</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Browser: {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'Unknown'}</div>
              <div>MediaRecorder supported: {typeof MediaRecorder !== 'undefined' ? '✅' : '❌'}</div>
              <div>getUserMedia supported: {typeof navigator !== 'undefined' && navigator.mediaDevices ? '✅' : '❌'}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}