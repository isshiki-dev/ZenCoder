"use client";
import { useState } from 'react';
import { MessageList, Message, ToolExecution } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (content: string) => {
    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, model: 'minimax-m2.5-free' }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantMsg: Message = { role: 'assistant', content: '', tools: [] };
      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === 'text') {
              assistantMsg.content += data.content;
            } else if (data.type === 'tool_start') {
              assistantMsg.tools = [...(assistantMsg.tools || []), {
                tool: data.tool,
                input: data.input,
                status: 'running'
              }];
            } else if (data.type === 'tool_end') {
              assistantMsg.tools = (assistantMsg.tools || []).map(t =>
                t.tool === data.tool && t.status === 'running'
                ? { ...t, output: data.output, status: 'done' }
                : t
              );
            } else if (data.type === 'error') {
               assistantMsg.content += `\n[Error: ${data.content}]`;
            }

            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...assistantMsg };
              return updated;
            });
          } catch (e) {
            console.error('Error parsing chunk', e);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen max-w-4xl mx-auto border-x bg-white">
      <header className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Zen AI Agent</h1>
          <p className="text-xs text-gray-500">Powered by OpenCode Zen</p>
        </div>
        <div className="flex gap-2">
           <select className="text-sm border rounded p-1">
             <option>MiniMax M2.5 Free</option>
             <option>Kimi K2.5 Free</option>
             <option>Big Pickle</option>
           </select>
        </div>
      </header>

      <MessageList messages={messages} />

      <ChatInput onSend={handleSend} loading={loading} />
    </main>
  );
}
