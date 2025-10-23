'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Agent } from '@/lib/types';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, GitFork } from 'lucide-react';
import { AVAILABLE_TOOLS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SharePage() {
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAgent() {
      try {
        const response = await fetch(`/api/agents/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch agent');
        }
        const data = await response.json();
        setAgent(data);
      } catch (error) {
        console.error('Error fetching agent:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchAgent();
    }
  }, [params.id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Agent share link copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleFork = () => {
    // Store agent data in localStorage and redirect to create page
    if (agent) {
      localStorage.setItem('forkAgent', JSON.stringify({
        title: `${agent.title} (Fork)`,
        description: agent.description,
        prompt: agent.prompt,
        tools: agent.tools,
        originalAgentId: agent.id
      }));
      window.location.href = '/create';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-lg">Loading agent...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="py-16 text-center">
            <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The agent you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/">
              <Button>Browse All Agents</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{agent.title}</h1>
              <p className="text-muted-foreground text-lg">{agent.description}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button
                onClick={handleFork}
                className="flex items-center gap-2"
              >
                <GitFork className="h-4 w-4" />
                Fork Agent
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Agent settings and tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {agent.tools.map((tool) => (
                    <Badge key={tool} variant="secondary">
                      {AVAILABLE_TOOLS.find((t) => t.value === tool)?.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>The AI prompt for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {agent.prompt}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link href={`/run/${agent.id}`}>
            <Button size="lg" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Try This Agent
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
