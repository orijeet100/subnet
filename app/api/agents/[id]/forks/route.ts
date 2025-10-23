import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agentsTable } from '@/db/schema';
import { eq, and, like } from 'drizzle-orm';

// GET /api/agents/[id]/forks - Get fork count for an agent
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const agentId = parseInt(id);

    if (isNaN(agentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // Get the original agent
    const [originalAgent] = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.id, agentId))
      .limit(1);

    if (!originalAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Count existing forks of this agent (regardless of name)
    const forkCount = await db
      .select({ count: agentsTable.id })
      .from(agentsTable)
      .where(eq(agentsTable.originalAgentId, agentId));

    const nextForkNumber = forkCount.length + 1;
    const suggestedName = nextForkNumber === 1 
      ? `${originalAgent.name} (Fork)` 
      : `${originalAgent.name} (Fork ${nextForkNumber})`;

    return NextResponse.json({
      forkCount: forkCount.length,
      nextForkNumber,
      suggestedName,
      originalAgent: {
        id: originalAgent.id.toString(),
        name: originalAgent.name,
        description: originalAgent.description,
        prompt: originalAgent.prompt,
        tools: originalAgent.tools,
      }
    });
  } catch (error) {
    console.error('Error fetching fork count:', error);
    return NextResponse.json({ error: 'Failed to fetch fork count' }, { status: 500 });
  }
}
