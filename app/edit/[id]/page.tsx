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
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPage({ params }: EditPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadAgent = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/agents/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load agent');
        }
        const agent = await response.json();
        
        setTitle(agent.title);
        setDescription(agent.description);
        setPrompt(agent.prompt);
        setSelectedTools(agent.tools || []);
      } catch (error) {
        console.error('Error loading agent:', error);
        toast({
          title: "Failed to load agent",
          description: "Could not load agent data. Please try again.",
          variant: "destructive",
        });
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadAgent();
  }, [params, router, toast]);

  const handleToolToggle = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleAIGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    setPrompt(''); // Clear existing content for streaming
    
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'prompt',
          description: title || 'AI agent',
          existingContent: prompt,
          contextField: description, // Use description as context for prompt generation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        
        if (errorData.error === 'MALICIOUS_PROMPT') {
          console.log('Malicious prompt detected, showing toast');
          toast({
            title: "Nice try! 😏",
            description: errorData.message,
          });
          return;
        }
        
        // For other errors, show generic error
        toast({
          title: "Failed to generate prompt",
          description: "Could not generate AI prompt. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                toast({
                  title: "Prompt generated!",
                  description: "AI has generated a prompt for your agent",
                });
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  generatedText += parsed.content;
                  setPrompt(generatedText);
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast({
        title: "Failed to generate prompt",
        description: "Could not generate AI prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleAIGenerateDescription = async () => {
    setIsGeneratingDescription(true);
    setDescription(''); // Clear existing content for streaming
    
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'description',
          description: title || 'AI agent',
          existingContent: description,
          contextField: prompt, // Use prompt as context for description generation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        
        if (errorData.error === 'MALICIOUS_PROMPT') {
          console.log('Malicious prompt detected, showing toast');
          toast({
            title: "Nice try! 😏",
            description: errorData.message,
          });
          return;
        }
        
        // For other errors, show generic error
        toast({
          title: "Failed to generate description",
          description: "Could not generate AI description. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                toast({
                  title: "Description generated!",
                  description: "AI has generated a description for your agent",
                });
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  generatedText += parsed.content;
                  setDescription(generatedText);
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: "Failed to generate description",
        description: "Could not generate AI description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one tool is selected
    if (selectedTools.length === 0) {
      toast({
        title: "Tools Required",
        description: "Please select at least one tool for your agent.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { id } = await params;
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          prompt,
          tools: selectedTools,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update agent');
      }

      toast({
        title: "Agent updated!",
        description: "Your agent has been successfully updated.",
      });
      router.push('/');
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: "Failed to update agent",
        description: "Could not update agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <main className="container mx-auto max-w-3xl px-4 py-8">
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-lg">Loading agent...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-4xl font-bold">Edit Agent</h1>
          <p className="text-muted-foreground">
            Update your Subconscious agent with new instructions and search tools
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt">Agent Instructions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIGeneratePrompt}
                    disabled={isGeneratingPrompt}
                    className="gap-2"
                    title="Generate AI prompt for your agent"
                  >
                    {isGeneratingPrompt ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    AI Generate
                  </Button>
                </div>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIGenerateDescription}
                    disabled={isGeneratingDescription}
                    className="gap-2"
                    title="Generate AI description for your agent"
                  >
                    {isGeneratingDescription ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    AI Generate
                  </Button>
                </div>
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
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating Agent...
                    </>
                  ) : (
                    'Update Agent'
                  )}
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
