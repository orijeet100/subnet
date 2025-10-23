'use client';

import Link from 'next/link';
import type { Agent } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Share2, GitFork, Users } from 'lucide-react';
import { useState } from 'react';
import { AVAILABLE_TOOLS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AgentCardProps {
  agent: Agent;
  onDelete?: (agentId: string) => void;
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${agent.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      onDelete?.(agent.id);
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/share/${agent.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
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

  const handleFork = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Get fork information from API
      const response = await fetch(`/api/agents/${agent.id}/forks`);
      if (!response.ok) {
        throw new Error('Failed to get fork information');
      }
      
      const forkData = await response.json();
      
      // Store agent data in localStorage and redirect to create page
      localStorage.setItem('forkAgent', JSON.stringify({
        title: forkData.suggestedName,
        description: forkData.originalAgent.description,
        prompt: forkData.originalAgent.prompt,
        tools: forkData.originalAgent.tools,
        originalAgentId: agent.id
      }));
      
      window.location.href = '/create';
    } catch (error) {
      console.error('Error getting fork information:', error);
      // Fallback to simple fork naming
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

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl">{agent.title}</CardTitle>
            <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 h-8 w-8 shrink-0"
              onClick={handleShare}
              title="Share agent"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-green-600 hover:bg-green-50 h-8 w-8 shrink-0"
              onClick={handleFork}
              title="Fork agent"
            >
              <GitFork className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete agent"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2">
            <p className="text-muted-foreground text-sm font-medium">Tools:</p>
            <div className="flex flex-wrap gap-2">
              {agent.tools.slice(0, 2).map((tool) => (
                <Badge key={tool} variant="secondary" className="text-xs">
                  {AVAILABLE_TOOLS.find((t) => t.value === tool)?.label}
                </Badge>
              ))}
              {agent.tools.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{agent.tools.length - 2}
                </Badge>
              )}
            </div>
          </div>
          {agent.forkCount && agent.forkCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Users className="h-3 w-3" />
              <span>{agent.forkCount} fork{agent.forkCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/run/${agent.id}`} className="w-full">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
            View Agent
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
