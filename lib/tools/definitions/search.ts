import { ToolDefinition } from '../types';

export const webSearchTool: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for information.',
  parameters: {
    query: { type: 'string', description: 'Search query', required: true }
  },
  execute: async ({ query }) => {
    return [
      { title: `Result for ${query}`, url: 'https://example.com', snippet: 'This is a mock search result snippet.' }
    ];
  }
};
