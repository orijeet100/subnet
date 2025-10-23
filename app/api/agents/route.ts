import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agentsTable } from '@/db/schema';
import { desc, eq, and, like, asc } from 'drizzle-orm';

// GET /api/agents - Get agents with optional sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'recent';
    
    let orderBy;
    switch (sort) {
      case 'az':
        orderBy = asc(agentsTable.name);
        break;
      case 'forks':
        // We'll handle this in the mapping since we need to count forks
        orderBy = desc(agentsTable.id);
        break;
      case 'leaderboard':
        orderBy = desc(agentsTable.stars);
        break;
      case 'recent':
      default:
        orderBy = desc(agentsTable.id);
        break;
    }
    
    const agents = await db.select().from(agentsTable).orderBy(orderBy).limit(50);

    // Map database fields to match Agent interface and add fork counts
    const mappedAgents = await Promise.all(
      agents.map(async (agent) => {
        // Count forks for this agent (regardless of name)
        const forkCount = await db
          .select({ count: agentsTable.id })
          .from(agentsTable)
          .where(eq(agentsTable.originalAgentId, agent.id));

        return {
          id: agent.id.toString(),
          title: agent.name,
          description: agent.description,
          prompt: agent.prompt,
          tools: (agent.tools as string[]) || [],
          stars: agent.stars || 0,
          ...(forkCount.length > 0 && { forkCount: forkCount.length }),
        };
      })
    );

    // Sort by forks if requested (since we can't do this in SQL easily)
    if (sort === 'forks') {
      mappedAgents.sort((a, b) => (b.forkCount || 0) - (a.forkCount || 0));
    }

    return NextResponse.json(mappedAgents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, prompt, tools, originalAgentId } = body;

    if (!title || !description || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newAgent] = await db
      .insert(agentsTable)
      .values({
        name: title,
        description,
        prompt,
        tools: tools || [],
        originalAgentId: originalAgentId ? parseInt(originalAgentId) : null,
      })
      .returning();

    // Map database fields to match Agent interface
    const mappedAgent = {
      id: newAgent.id.toString(),
      title: newAgent.name,
      description: newAgent.description,
      prompt: newAgent.prompt,
      tools: (newAgent.tools as string[]) || [],
    };

    return NextResponse.json(mappedAgent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}

// PATCH /api/agents - Update agent stars
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, stars } = body;

    if (!id || stars === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [updatedAgent] = await db
      .update(agentsTable)
      .set({ stars: Math.max(0, stars) })
      .where(eq(agentsTable.id, parseInt(id)))
      .returning();

    if (!updatedAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      id: updatedAgent.id.toString(),
      stars: updatedAgent.stars 
    });
  } catch (error) {
    console.error('Error updating agent stars:', error);
    return NextResponse.json({ error: 'Failed to update agent stars' }, { status: 500 });
  }
}
