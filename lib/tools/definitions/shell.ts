import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolDefinition } from '../types';

const execAsync = promisify(exec);

export const shellTool: ToolDefinition = {
  name: 'execute_shell',
  description: 'Execute a shell command in the sandbox.',
  parameters: {
    command: {
      type: 'string',
      description: 'The shell command to execute.',
      required: true
    }
  },
  execute: async ({ command }) => {
    const dangerousCommands = ['rm -rf /', 'mkfs', 'dd if=/dev/zero'];
    if (dangerousCommands.some(c => command.includes(c))) {
      throw new Error('Dangerous command detected.');
    }

    try {
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    } catch (error: any) {
      return { error: error.message, stdout: error.stdout, stderr: error.stderr };
    }
  }
};
