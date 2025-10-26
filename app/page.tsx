'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/lib/types';
import { Header } from '@/components/header';
import { AgentCard } from '@/components/agent-card';
import { SortFilter, type SortOption } from '@/components/sort-filter';
import { Button } from '@/components/ui/button';
import { Wand2, Bot, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { generateDefaultAvatar } from '@/lib/default-avatar';

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>('recent');
  const [showCompleteAgentDialog, setShowCompleteAgentDialog] = useState(false);
  const [completeAgentPrompt, setCompleteAgentPrompt] = useState('');
  const [isGeneratingCompleteAgent, setIsGeneratingCompleteAgent] = useState(false);

  // Function to get default profile photo base64 from server
  const generateDefaultProfilePhotoFromServer = async (): Promise<string> => {
    try {
      const response = await fetch('/api/generate-default-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate default avatar');
      }

      const data = await response.json();
      return data.base64Image;
    } catch (error) {
      console.error('Error generating default profile photo:', error);
      return 'null_profile.jpg';
    }
  };

  const fetchAgents = async (isRefresh = false, sort: SortOption = currentSort) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetch(`/api/agents?sort=${sort}`);
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
    // Load sort preference from session storage
    const savedSort = sessionStorage.getItem('agentSortFilter') as SortOption;
    if (savedSort && ['recent', 'az', 'forks', 'leaderboard'].includes(savedSort)) {
      setCurrentSort(savedSort);
      fetchAgents(false, savedSort);
    } else {
      fetchAgents();
    }
  }, []);

  const handleSortChange = async (sort: SortOption) => {
    setCurrentSort(sort);
    // Save sort preference to session storage
    sessionStorage.setItem('agentSortFilter', sort);
    await fetchAgents(false, sort);
  };

  const handleGenerateCompleteAgent = async () => {
    if (!completeAgentPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your agent.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCompleteAgent(true);
    
    try {
      // First, generate the agent configuration
      const generateResponse = await fetch('/api/ai-generate-complete-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: completeAgentPrompt,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        
        if (errorData.error === 'MALICIOUS_PROMPT') {
          toast({
            title: "Nice try! 😏",
            description: errorData.message,
          });
          return;
        }
        
        throw new Error('Failed to generate complete agent');
      }

      const agentData = await generateResponse.json();
      
      // Generate default profile photo base64 from server
      const defaultProfilePhoto = await generateDefaultProfilePhotoFromServer();

      // Now create the agent directly in the database
      const createResponse = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: agentData.title,
          description: agentData.description,
          prompt: agentData.prompt,
          tools: agentData.tools,
          profilePhoto: defaultProfilePhoto,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create agent');
      }

      const createdAgent = await createResponse.json();
      
      // Close dialog and refresh the agent list
      setShowCompleteAgentDialog(false);
      setCompleteAgentPrompt('');
      
      // Refresh the agent list to show the new agent
      await fetchAgents(false, currentSort);
      
      toast({
        title: "Agent Created!",
        description: `"${createdAgent.title}" has been successfully created and added to the database.`,
      });
    } catch (error) {
      console.error('Error generating complete agent:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create complete agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCompleteAgent(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
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
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowCompleteAgentDialog(true)}
                disabled={isGeneratingCompleteAgent}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Complete Agent
              </Button>
              <SortFilter currentSort={currentSort} onSortChange={handleSortChange} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                onStarsChange={async () => {
                  // Refresh the agent list when stars change to update rankings
                  await fetchAgents(false, currentSort);
                }}
              />
            ))}
          </div>
        )}

        {/* Generate Complete Agent Dialog */}
        <Dialog open={showCompleteAgentDialog} onOpenChange={setShowCompleteAgentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Complete Agent</DialogTitle>
              <DialogDescription>
                Describe what you want your agent to do, and AI will generate and create the complete agent automatically. The agent will be added to the database and appear in your agent list.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Describe your agent:</label>
                <Textarea
                  value={completeAgentPrompt}
                  onChange={(e) => setCompleteAgentPrompt(e.target.value)}
                  placeholder="e.g., I want an agent that can research topics online, summarize articles, and help with academic writing. It should be able to search the web, read web pages, and provide detailed analysis."
                  className="mt-2"
                  rows={4}
                />
              </div>

              {isGeneratingCompleteAgent && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="flex items-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Creating complete agent...</span>
                  </div>
                  <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    ⚠️ Don't cancel or agent creation will fail
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (isGeneratingCompleteAgent) {
                    toast({
                      title: "Generation in Progress",
                      description: "Please wait for the current generation to complete before canceling.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowCompleteAgentDialog(false);
                  setCompleteAgentPrompt('');
                }}
                disabled={isGeneratingCompleteAgent}
              >
                Cancel
              </Button>
              
              <Button 
                onClick={handleGenerateCompleteAgent}
                disabled={isGeneratingCompleteAgent || !completeAgentPrompt.trim()}
                className="flex-1"
              >
                {isGeneratingCompleteAgent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Agent...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Create Agent
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
