'use client';

import { useEffect, useState } from 'react';
import type { Agent } from '@/lib/types';
import { Header } from '@/components/header';
import { AgentCard } from '@/components/agent-card';

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAgents = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoading(false);
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-foreground mb-2 text-4xl font-bold">Discover Agents</h1>
            {isRefreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
          <p className="text-muted-foreground">
            SubNet is a network of agents powered by Subconscious
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-lg">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4 text-lg">
              Hmm we didn't find any agents. Create the first agent on SubNet!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={async (agentId) => {
                  // Remove the deleted agent from local state immediately for better UX
                  setAgents(agents.filter((a) => a.id !== agentId));
                  // Refetch all agents to get updated fork counts
                  await fetchAgents(true);
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
