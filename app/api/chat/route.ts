import { NextResponse } from 'next/server';
import { chatStream } from '@/lib/llm';
import { prisma } from '@/lib/prisma';
import { initTools } from '@/lib/tools/init';
import { executeTool } from '@/lib/tools/executor';
import { z } from "zod";
import { FreeModel } from '@/lib/opencode-zen';

export const dynamic = 'force-dynamic';

initTools();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, conversationId, model } = z.object({
      messages: z.array(z.any()),
      conversationId: z.string().optional(),
      model: z.string().optional(),
    }).parse(body);

    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: { title: messages[0].content.substring(0, 50) }
      });
      convId = conv.id;
    }

    const lastMsg = messages[messages.length - 1];
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: lastMsg.role,
        content: lastMsg.content
      }
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        let currentMessages = [...messages];
        let assistantContent = '';
        let maxIterations = 5;

        try {
          while (maxIterations--) {
            const stream = await chatStream(currentMessages, model as FreeModel);
            let toolCalls: any[] = [];
            assistantContent = '';

            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta;
              if (delta?.content) {
                assistantContent += delta.content;
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', content: delta.content }) + '\n'));
              }
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (!toolCalls[tc.index]) {
                    toolCalls[tc.index] = { id: tc.id, function: { name: '', arguments: '' } };
                  }
                  if (tc.id) toolCalls[tc.index].id = tc.id;
                  if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name;
                  if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
                }
              }
            }

            if (toolCalls.length > 0) {
              const assistantMsg = await prisma.message.create({
                data: {
                  conversationId: convId,
                  role: 'assistant',
                  content: assistantContent || '',
                }
              });

              currentMessages.push({ role: 'assistant', content: assistantContent, tool_calls: toolCalls });

              for (const tc of toolCalls) {
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'tool_start', tool: tc.function.name, input: tc.function.arguments }) + '\n'));

                let result;
                try {
                  result = await executeTool(assistantMsg.id, tc.function.name, JSON.parse(tc.function.arguments));
                } catch (e: any) {
                  result = { error: e.message };
                }

                controller.enqueue(encoder.encode(JSON.stringify({ type: 'tool_end', tool: tc.function.name, output: result }) + '\n'));

                currentMessages.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: tc.function.name,
                  content: JSON.stringify(result)
                });
              }
            } else {
              await prisma.message.create({
                data: {
                  conversationId: convId,
                  role: 'assistant',
                  content: assistantContent
                }
              });
              break;
            }
          }
        } catch (e: any) {
          console.error('Streaming error:', e);
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', content: e.message }) + '\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: { 'Content-Type': 'application/x-ndjson' },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
