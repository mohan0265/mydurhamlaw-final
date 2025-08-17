'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatBubble } from './chat/ChatBubble'
import { ChatInput } from './chat/ChatInput'
import { ChatLoading } from './chat/ChatLoading'
import { useAuth } from '@/lib/supabase/AuthContext'
import { Message } from '@/types/chat'
import { 
  streamGPT4oResponse, 
  interruptVoice, 
  playAssistantVoice
} from '@/lib/openai'

interface DurmahChatProps {
  isListening: boolean
  onMessagesChange: (messages: Message[]) => void;
  onThinkingChange: (isThinking: boolean) => void;
}

const DurmahChat: React.FC<DurmahChatProps> = ({ 
  isListening,
  onMessagesChange,
  onThinkingChange,
}) => {
  const { user, userProfile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false); // New state for TTS playback
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    onThinkingChange(loading || isSpeaking); // isThinking is true if loading or speaking
  }, [loading, isSpeaking, onThinkingChange]);

  const handleSubmit = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !user?.id) return

    // Stop listening immediately after user input is captured
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    const userMessage: Message = { 
      id: Date.now().toString(),
      role: 'user', 
      content: messageContent.trim(),
      timestamp: new Date().toISOString()
    }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)
    setInput(''); // Clear input after sending

    try {
      const response = await streamGPT4oResponse(
        updatedMessages,
        user.id,
        'general',
      )

      let fullText = '';
      let assistantMessageId = Date.now().toString();

      setMessages(prev => [...prev, { 
        id: assistantMessageId,
        role: 'assistant', 
        content: '',
        timestamp: new Date().toISOString()
      }]);

      for await (const chunk of response.streamChunks) {
        fullText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const lastMsgIndex = updated.findIndex(m => m.id === assistantMessageId);
          if (lastMsgIndex !== -1) {
            const prevMessage = updated[lastMsgIndex];
            if (prevMessage) {
              updated[lastMsgIndex] = { 
                id: prevMessage.id || assistantMessageId,
                role: 'assistant',
                content: fullText,
                timestamp: prevMessage.timestamp || new Date().toISOString()
              }
            }
          }
          return updated;
        });
      }

      setIsSpeaking(true); // Set speaking state to true when TTS starts
      playAssistantVoice(fullText);

    } catch (error) {
      console.error('Error in handleSubmit:', error)
    } finally {
      setLoading(false)
      // Listening will be re-enabled by DurmahVoiceCompanion after speech ends
    }
  }, [messages, user?.id, isListening])

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error("Speech recognition not supported");
      return;
    }

    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true; 
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-GB';

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSubmit(transcript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognitionRef.current.onend = () => {
      // This onend fires when speech recognition stops, either manually or due to silence.
      // We don't want to automatically restart listening here if the assistant is about to speak.
      // The re-activation of listening will be handled by DurmahVoiceCompanion after TTS finishes.
    };

    if (isListening) {
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
    }

    return () => {
      recognitionRef.current.stop();
    };
  }, [isListening, handleSubmit]);

  // Listen for the custom event when assistant speech ends
  useEffect(() => {
    const handleAssistantSpeechEnd = () => {
      setIsSpeaking(false);
    };

    window.addEventListener('durmah-assistant-speech-end', handleAssistantSpeechEnd);

    return () => {
      window.removeEventListener('durmah-assistant-speech-end', handleAssistantSpeechEnd);
    };
  }, []);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex-1 overflow-y-auto mb-6 space-y-1">
        {messages.map((msg: Message, idx: number) => (
          <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {loading && <ChatLoading />}
      </div>
      <ChatInput 
        input={input} 
        setInput={setInput} 
        onSubmit={() => handleSubmit(input)}
        isListening={isListening}
        onInterruptVoice={interruptVoice}
        disabled={loading}
        placeholder={isListening ? "Listening..." : "Message Durmah..."}
      />
    </div>
  )
}

export default DurmahChat