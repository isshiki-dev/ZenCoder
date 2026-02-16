import { opencodeZen, FreeModel } from './opencode-zen';
import { toolRegistry } from './tools/registry';

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Retrying... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return withRetry(fn, retries - 1);
  }
}

export async function chatStream(
  messages: any[],
  model: FreeModel = 'minimax-m2.5-free'
) {
  const tools = toolRegistry.getSchema();

  return withRetry(async () => {
    const response = await opencodeZen.chat.completions.create({
      model,
      messages,
      tools: tools.length > 0 ? tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      })) : undefined,
      stream: true,
    });

    return response;
  });
}
