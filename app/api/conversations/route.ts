import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' }
  });
  return NextResponse.json(conversations);
}
