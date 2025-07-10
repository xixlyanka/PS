import React, { useState, useRef, useEffect } from 'react';
import { Message, AgentState, MessageAuthor, Attachment } from '../types';
import { Paperclip, Send, ThumbsDown, ThumbsUp } from 'lucide-react';

export const ChatWindow: React.FC<{
  messages: Message[];
  onSendMessage: (content: string, attachments: File[]) => void;
  agentState: AgentState;
}> = ({ messages, onSendMessage, agentState }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (input.trim() || attachments.length > 0) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <div className="bg-bg-primary/80 backdrop-blur-md rounded-lg shadow-xl flex flex-col h-full border border-border-primary/20">
      <div className="flex-grow overflow-y-auto p-4 scrollbar-thin">
        {messages.map((message) => (
          <div key={message.id} className={`flex mb-4 ${message.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg p-3 max-w-lg shadow-md ${
              message.author === MessageAuthor.USER
                ? 'bg-accent text-bg-primary' // ИСПРАВЛЕНО: Цвет текста теперь контрастный
                : 'bg-bg-secondary text-text-primary'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {agentState.isThinking && (
            <div className="flex justify-start mb-4">
                <div className="rounded-lg p-3 max-w-lg bg-bg-secondary text-text-primary">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse delay-150"></div>
                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse delay-300"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border-primary">
        <div className="bg-bg-secondary rounded-lg flex items-center p-2">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-text-secondary hover:text-accent transition-colors">
            <Paperclip size={20} />
          </button>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your command or attach files..."
            className="flex-grow bg-transparent focus:outline-none px-2 text-text-primary"
          />
          <button onClick={handleSend} className="p-2 text-text-secondary hover:text-accent transition-colors">
            <Send size={20} />
          </button>
        </div>
        {attachments.length > 0 && (
            <div className="text-xs text-text-secondary mt-2">
                Attached: {attachments.map(f => f.name).join(', ')}
            </div>
        )}
      </div>
    </div>
  );
};
