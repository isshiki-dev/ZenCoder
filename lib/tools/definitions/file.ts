import fs from 'fs/promises';
import { ToolDefinition } from '../types';

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read the contents of a file.',
  parameters: {
    path: { type: 'string', description: 'Path to the file', required: true }
  },
  execute: async ({ path }) => {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return content;
    } catch (error: any) {
      return { error: error.message };
    }
  }
};

export const writeFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Write content to a file.',
  parameters: {
    path: { type: 'string', description: 'Path to the file', required: true },
    content: { type: 'string', description: 'Content to write', required: true }
  },
  execute: async ({ path, content }) => {
    try {
      await fs.writeFile(path, content, 'utf-8');
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }
};
