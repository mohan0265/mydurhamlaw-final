import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

interface ChatSidebarProps {
  lovedOneName: string;
  onClose: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ lovedOneName, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: string; timestamp: Date }>>([]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'You',
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  return (
    <div className="w-80 bg-gray-100 flex flex-col">
      {/* Chat Header */}
      <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
        <h3 className="font-semibold">Chat with {lovedOneName}</h3>
        <button onClick={onClose} className="hover:text-gray-300">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs p-3 rounded-lg ${
              msg.sender === 'You' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-800 border'
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={sendMessage}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};