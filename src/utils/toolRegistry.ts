import { ToolRegistry, ToolDefinition } from '../types';
import DatabaseManager from './database';

class ToolRegistryManager {
  private registry: ToolRegistry = {};
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.initializeDefaultTools();
  }

  private initializeDefaultTools(): void {
    // Register default tools
    this.registerTool({
      name: 'shell_command',
      description: 'Execute a shell command safely in a sandboxed environment',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to execute'
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default 10000)',
            default: 10000
          }
        },
        required: ['command']
      }
    });

    this.registerTool({
      name: 'file_read',
      description: 'Read the contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to read'
          }
        },
        required: ['path']
      }
    });

    this.registerTool({
      name: 'file_write',
      description: 'Write content to a file',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to write'
          },
          content: {
            type: 'string',
            description: 'The content to write to the file'
          }
        },
        required: ['path', 'content']
      }
    });

    this.registerTool({
      name: 'code_execute_python',
      description: 'Execute Python code in a sandboxed environment',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The Python code to execute'
          }
        },
        required: ['code']
      }
    });

    this.registerTool({
      name: 'code_execute_nodejs',
      description: 'Execute JavaScript/Node.js code in a sandboxed environment',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The JavaScript/Node.js code to execute'
          }
        },
        required: ['code']
      }
    });

    this.registerTool({
      name: 'web_search',
      description: 'Perform a web search to find information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          }
        },
        required: ['query']
      }
    });
  }

  registerTool(tool: ToolDefinition): void {
    this.registry[tool.name] = tool;
    this.db.registerTool(tool.name, tool.description, tool.parameters);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.registry[name];
  }

  getAllTools(): ToolDefinition[] {
    return Object.values(this.registry);
  }

  getToolNames(): string[] {
    return Object.keys(this.registry);
  }

  validateArguments(toolName: string, args: any): { valid: boolean; errors?: string[] } {
    const tool = this.getTool(toolName);
    if (!tool) {
      return { valid: false, errors: [`Tool '${toolName}' not found`] };
    }

    const errors: string[] = [];
    const { required, properties } = tool.parameters;

    // Check required fields
    for (const field of required) {
      if (!(field in args)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field types
    for (const [field, value] of Object.entries(args)) {
      if (properties[field]) {
        const expectedType = properties[field].type;
        const actualType = typeof value;

        if (actualType !== expectedType) {
          errors.push(`Field '${field}' expects type '${expectedType}', got '${actualType}'`);
        }
      }
    }

    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }
}

export default ToolRegistryManager;