import { prisma } from '../prisma';
import { toolRegistry } from './registry';

export async function executeTool(
  messageId: string,
  toolName: string,
  args: any
) {
  const tool = toolRegistry.getTool(toolName);
  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }

  const startTime = Date.now();

  const log = await prisma.toolExecution.create({
    data: {
      messageId,
      toolName,
      input: JSON.stringify(args),
      status: 'pending',
    },
  });

  try {
    const result = await tool.execute(args);
    const duration = Date.now() - startTime;

    await prisma.toolExecution.update({
      where: { id: log.id },
      data: {
        output: JSON.stringify(result),
        status: 'success',
        duration,
      },
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    await prisma.toolExecution.update({
      where: { id: log.id },
      data: {
        error: error.message,
        status: 'error',
        duration,
      },
    });

    throw error;
  }
}
