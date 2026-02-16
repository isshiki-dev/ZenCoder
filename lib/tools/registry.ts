import { ToolDefinition } from './types';

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getSchema() {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters,
        required: Object.entries(tool.parameters)
          .filter(([_, p]) => p.required)
          .map(([name, _]) => name)
      }
    }));
  }
}

export const toolRegistry = new ToolRegistry();
