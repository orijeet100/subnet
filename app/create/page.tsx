'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AVAILABLE_TOOLS } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [originalAgentId, setOriginalAgentId] = useState<string | null>(null);

  useEffect(() => {
    // Check for forked agent data in localStorage
    const forkData = localStorage.getItem('forkAgent');
    if (forkData) {
      try {
        const agent = JSON.parse(forkData);
        setTitle(agent.title || '');
        setDescription(agent.description || '');
        setPrompt(agent.prompt || '');
        setSelectedTools(agent.tools || []);
        setOriginalAgentId(agent.originalAgentId || null);
        // Clear the fork data after using it
        localStorage.removeItem('forkAgent');
      } catch (error) {
        console.error('Error parsing fork data:', error);
      }
    }
  }, []);

  const handleToolToggle = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const agent = {
      title,
      description,
      prompt,
      tools: selectedTools,
      originalAgentId: originalAgentId,
    };

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agent),
      });

      if (!response.ok) {
        throw new Error('Failed to create agent');
      }

      router.push('/');
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent. Please try again.');
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-4xl font-bold">Create New Agent</h1>
          <p className="text-muted-foreground">
            Configure your Subconscious agent with instructions and search tools
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt">Agent Instructions</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="You are a search assistant that can use tools to find information. I want you to..."
                  rows={10}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Available Tools</Label>
                <div className="space-y-3">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <div key={tool.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={tool.value}
                        checked={selectedTools.includes(tool.value)}
                        onCheckedChange={() => handleToolToggle(tool.value)}
                      />
                      <label
                        htmlFor={tool.value}
                        className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tool.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="text-muted-foreground text-sm">
                This information is purely to make your agent discoverable.
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Research Assistant"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this agent does so a human can understand why they would use it."
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 cursor-pointer"
                >
                  Create Agent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex-1 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
