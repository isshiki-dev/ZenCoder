import { toolRegistry } from '../registry';
import { shellTool } from './shell';
import { readFileTool, writeFileTool } from './file';
import { executeCodeTool } from './code';
import { webSearchTool } from './search';

export function registerAllTools() {
  toolRegistry.register(shellTool);
  toolRegistry.register(readFileTool);
  toolRegistry.register(writeFileTool);
  toolRegistry.register(executeCodeTool);
  toolRegistry.register(webSearchTool);
}
