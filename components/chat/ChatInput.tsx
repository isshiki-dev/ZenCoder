"use client";
import React, { useState } from 'react';
import { Send } from 'lucide-react';

export const ChatInput = ({ onSend, loading }: { onSend: (msg: string) => void, loading: boolean }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50"
      >
        <Send size={20} />
      </button>
    </form>
  );
};
