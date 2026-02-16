import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { ToolExecutionResult } from '../types';
import DatabaseManager from './database';
import ToolRegistryManager from './toolRegistry';

class ToolExecutor {
  private db: DatabaseManager;
  private toolRegistry: ToolRegistryManager;

  constructor(db: DatabaseManager, toolRegistry: ToolRegistryManager) {
    this.db = db;
    this.toolRegistry = toolRegistry;
  }

  async executeTool(
    toolName: string, 
    argumentsData: any
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Validate arguments before execution
      const validation = this.toolRegistry.validateArguments(toolName, argumentsData);
      if (!validation.valid) {
        return {
          success: false,
          output: '',
          error: `Invalid arguments: ${validation.errors?.join(', ')}`,
          executionTime: Date.now() - startTime
        };
      }

      let result: ToolExecutionResult;

      switch (toolName) {
        case 'shell_command':
          result = await this.executeShellCommand(argumentsData);
          break;
        case 'file_read':
          result = await this.readFile(argumentsData);
          break;
        case 'file_write':
          result = await this.writeFile(argumentsData);
          break;
        case 'code_execute_python':
          result = await this.executePythonCode(argumentsData);
          break;
        case 'code_execute_nodejs':
          result = await this.executeNodeJSCode(argumentsData);
          break;
        case 'web_search':
          result = await this.webSearch(argumentsData);
          break;
        default:
          return {
            success: false,
            output: '',
            error: `Unknown tool: ${toolName}`,
            executionTime: Date.now() - startTime
          };
      }

      // Log execution to database
      this.db.logToolExecution(toolName, argumentsData, result);

      return {
        ...result,
        executionTime: Date.now() - startTime
      };
    } catch (error: any) {
      const result = {
        success: false,
        output: '',
        error: error.message || 'Unknown error occurred during tool execution',
        executionTime: Date.now() - startTime
      };

      // Log execution to database even for errors
      this.db.logToolExecution(toolName, argumentsData, result);

      return result;
    }
  }

  private async executeShellCommand(args: { command: string; timeout?: number }): Promise<ToolExecutionResult> {
    return new Promise((resolve) => {
      const timeout = args.timeout || 10000; // Default 10 seconds
      
      // Security: Only allow safe commands, prevent dangerous operations
      const forbiddenPatterns = [
        /rm\s+-rf/,
        /rm\s+--no-preserve-root/,
        /mv\s+.*\/\s+\.\/\.\.\//,
        /\|\s*sudo/,
        /&&\s*sudo/,
        />\s*\/etc\//,
        />\s*\/root\//
      ];
      
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(args.command)) {
          resolve({
            success: false,
            output: '',
            error: 'Forbidden command detected',
            executionTime: 0
          });
          return;
        }
      }

      const child = spawn(args.command, { shell: true, timeout: timeout });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            executionTime: 0 // Will be overridden by caller
          });
        } else {
          resolve({
            success: false,
            output: output,
            error: errorOutput || `Command exited with code ${code}`,
            executionTime: 0 // Will be overridden by caller
          });
        }
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message,
          executionTime: 0 // Will be overridden by caller
        });
      });
    });
  }

  private async readFile(args: { path: string }): Promise<ToolExecutionResult> {
    try {
      // Security: Prevent path traversal attacks
      const resolvedPath = path.resolve(process.cwd(), args.path);
      const baseDir = process.cwd();
      
      if (!resolvedPath.startsWith(baseDir)) {
        return {
          success: false,
          output: '',
          error: 'Path traversal detected',
          executionTime: 0
        };
      }

      const content = await fs.readFile(resolvedPath, 'utf8');
      return {
        success: true,
        output: content,
        executionTime: 0 // Will be overridden by caller
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: 0 // Will be overridden by caller
      };
    }
  }

  private async writeFile(args: { path: string; content: string }): Promise<ToolExecutionResult> {
    try {
      // Security: Prevent path traversal attacks
      const resolvedPath = path.resolve(process.cwd(), args.path);
      const baseDir = process.cwd();
      
      if (!resolvedPath.startsWith(baseDir)) {
        return {
          success: false,
          output: '',
          error: 'Path traversal detected',
          executionTime: 0
        };
      }

      // Ensure directory exists
      const dir = path.dirname(resolvedPath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(resolvedPath, args.content, 'utf8');
      return {
        success: true,
        output: `Successfully wrote ${args.content.length} characters to ${args.path}`,
        executionTime: 0 // Will be overridden by caller
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: 0 // Will be overridden by caller
      };
    }
  }

  private async executePythonCode(args: { code: string }): Promise<ToolExecutionResult> {
    // For security, we could run this in a container or with additional restrictions
    // For now, we'll execute with a timeout
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', ['-c', args.code], {
        timeout: 10000,
        maxBuffer: 1024 * 1024 // 1MB limit
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            executionTime: 0 // Will be overridden by caller
          });
        } else {
          resolve({
            success: false,
            output: output,
            error: errorOutput || `Python script exited with code ${code}`,
            executionTime: 0 // Will be overridden by caller
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message,
          executionTime: 0 // Will be overridden by caller
        });
      });
    });
  }

  private async executeNodeJSCode(args: { code: string }): Promise<ToolExecutionResult> {
    // For security, we could run this in a container or with additional restrictions
    // For now, we'll execute with a timeout
    return new Promise((resolve) => {
      const nodeProcess = spawn('node', ['-e', args.code], {
        timeout: 10000,
        maxBuffer: 1024 * 1024 // 1MB limit
      });

      let output = '';
      let errorOutput = '';

      nodeProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      nodeProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      nodeProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            executionTime: 0 // Will be overridden by caller
          });
        } else {
          resolve({
            success: false,
            output: output,
            error: errorOutput || `Node.js script exited with code ${code}`,
            executionTime: 0 // Will be overridden by caller
          });
        }
      });

      nodeProcess.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message,
          executionTime: 0 // Will be overridden by caller
        });
      });
    });
  }

  private async webSearch(args: { query: string }): Promise<ToolExecutionResult> {
    // In a real implementation, this would connect to a search API
    // For now, we'll return a placeholder response
    return {
      success: false,
      output: '',
      error: 'Web search functionality not implemented yet',
      executionTime: 0 // Will be overridden by caller
    };
  }
}

export default ToolExecutor;