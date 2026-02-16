export interface ToolParameter {
  type: string;
  description: string;
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (args: any) => Promise<any>;
}
