import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    include: { toolExecutions: true },
    orderBy: { createdAt: 'asc' }
  });
  return NextResponse.json(messages);
}
