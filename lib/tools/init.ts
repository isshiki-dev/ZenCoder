import { toolRegistry } from './registry';
import { shellTool } from './definitions/shell';
import { readFileTool, writeFileTool } from './definitions/file';
import { executeCodeTool } from './definitions/code';
import { webSearchTool } from './definitions/search';

let initialized = false;

export function initTools() {
  if (initialized) return;

  toolRegistry.register(shellTool);
  toolRegistry.register(readFileTool);
  toolRegistry.register(writeFileTool);
  toolRegistry.register(executeCodeTool);
  toolRegistry.register(webSearchTool);

  initialized = true;
}
