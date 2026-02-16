import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { ToolDefinition } from '../types';

const execAsync = promisify(exec);

export const executeCodeTool: ToolDefinition = {
  name: 'execute_code',
  description: 'Execute Python or Node.js code.',
  parameters: {
    language: { type: 'string', description: 'python or javascript', required: true },
    code: { type: 'string', description: 'The code to execute', required: true }
  },
  execute: async ({ language, code }) => {
    const filename = `temp_${Date.now()}.${language === 'python' ? 'py' : 'js'}`;
    await fs.writeFile(filename, code);
    try {
      const command = language === 'python' ? `python3 ${filename}` : `node ${filename}`;
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    } catch (error: any) {
      return { error: error.message, stdout: error.stdout, stderr: error.stderr };
    } finally {
      await fs.unlink(filename).catch(() => {});
    }
  }
};
