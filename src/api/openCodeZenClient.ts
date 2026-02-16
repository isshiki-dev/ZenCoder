import axios, { AxiosInstance } from 'axios';
import { OpenCodeZenConfig, StreamChunk, Message } from '../types';

class OpenCodeZenClient {
  private client: AxiosInstance;
  private config: OpenCodeZenConfig;

  constructor(config: OpenCodeZenConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.opencodezen.com',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async sendMessage(
    messages: Message[], 
    onStream?: (chunk: StreamChunk) => void,
    tools?: any[]
  ): Promise<{ content: string; toolCalls?: any[] }> {
    try {
      const requestData: any = {
        model: this.config.model || 'MiniMax M2.5 Free',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      if (tools && tools.length > 0) {
        requestData.tools = tools;
      }

      // For now, we'll simulate streaming since we don't know the exact API
      // In a real implementation, this would connect to the actual streaming endpoint
      const response = await this.client.post('/chat/completions', requestData);
      
      const content = response.data.choices[0].message.content;
      const toolCalls = response.data.choices[0].message.tool_calls;

      if (onStream) {
        // Simulate streaming by sending chunks
        if (content) {
          const chunkSize = 10;
          for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.substring(i, i + chunkSize);
            setTimeout(() => {
              onStream({ content: chunk, done: false });
            }, i * 50); // Simulate delay
          }
          
          // Mark as done
          setTimeout(() => {
            onStream({ done: true });
          }, content.length * 50);
        }
      }

      return { 
        content: content || '', 
        toolCalls: toolCalls || undefined 
      };
    } catch (error) {
      console.error('Error calling OpenCode Zen API:', error);
      throw error;
    }
  }

  // Method to handle different free models
  async switchModel(modelName: string): Promise<void> {
    this.config.model = modelName;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export default OpenCodeZenClient;