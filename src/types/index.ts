// Conversation types
export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResponses?: ToolResponse[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResponse {
  id: string;
  toolCallId: string;
  result: any;
  error?: string;
}

// Tool types
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolRegistry {
  [key: string]: ToolDefinition;
}

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

// API response types
export interface OpenCodeZenConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface StreamChunk {
  content?: string;
  toolCall?: ToolCall;
  done: boolean;
}