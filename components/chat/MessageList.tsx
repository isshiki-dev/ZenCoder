import React from 'react';
import { Terminal, CheckCircle, AlertCircle } from 'lucide-react';

export interface ToolExecution {
  tool: string;
  input: string;
  output?: any;
  status: 'running' | 'done' | 'error';
}

export interface Message {
  role: string;
  content: string;
  tools?: ToolExecution[];
}

export const MessageList = ({ messages }: { messages: Message[] }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-lg p-3 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'}`}>
            <div className="whitespace-pre-wrap">{msg.content}</div>

            {msg.tools && msg.tools.length > 0 && (
              <div className="mt-3 space-y-2">
                {msg.tools.map((tool, ti) => (
                  <div key={ti} className="text-xs bg-gray-100 p-2 rounded border border-gray-200 text-gray-700">
                    <div className="flex items-center gap-2 font-mono">
                      {tool.status === 'running' ? <Terminal size={14} className="animate-pulse text-blue-500" /> :
                       tool.status === 'done' ? <CheckCircle size={14} className="text-green-500" /> :
                       <AlertCircle size={14} className="text-red-500" />}
                      <span className="font-bold">{tool.tool}</span>
                    </div>
                    <div className="mt-1 text-gray-500 truncate">Args: {tool.input}</div>
                    {tool.output && (
                      <pre className="mt-1 overflow-x-auto max-h-32 bg-gray-800 text-gray-200 p-2 rounded text-[10px]">
                        {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
