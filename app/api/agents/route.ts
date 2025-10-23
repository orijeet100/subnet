import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agentsTable } from '@/db/schema';
import { desc } from 'drizzle-orm';

// GET /api/agents - Get first 50 agents
export async function GET() {
  try {
    const agents = await db.select().from(agentsTable).orderBy(desc(agentsTable.id)).limit(50);

    // Map database fields to match Agent interface
    const mappedAgents = agents.map((agent) => ({
      id: agent.id.toString(),
      title: agent.name,
      description: agent.description,
      prompt: agent.prompt,
      tools: (agent.tools as string[]) || [],
    }));

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
