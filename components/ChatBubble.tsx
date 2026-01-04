
import React from 'react';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div 
        className={`max-w-[90%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
          isUser 
            ? 'bg-amber-500 text-zinc-950 rounded-tr-none hover:bg-amber-400' 
            : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700 hover:border-zinc-600'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
      <div className="flex items-center gap-2 mt-1 px-1">
        {!isUser && (
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">GripBot</span>
        )}
        <span className="text-[10px] text-zinc-500 font-medium">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isUser && (
          <span className="text-[9px] font-bold text-amber-600/50 uppercase tracking-widest">You</span>
        )}
      </div>
    </div>
  );
};
