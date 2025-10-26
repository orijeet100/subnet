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
import { Trash2, Share2, GitFork, Users, Edit, Bot, Brain, Zap, Code, Search, MessageSquare, FileText, Database, Globe, Upload, Loader2, Camera, Sparkles, Check, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AVAILABLE_TOOLS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/star-rating';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generateDefaultAvatar } from '@/lib/default-avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface AgentCardProps {
  agent: Agent;
  onDelete?: (agentId: string) => void;
  onStarsChange?: () => void;
}

export function AgentCard({ agent, onDelete, onStarsChange }: AgentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [stars, setStars] = useState(agent.stars || 0);
  const [avatarImage, setAvatarImage] = useState<string | null>(() => {
    if (agent.profilePhoto && agent.profilePhoto !== 'null_profile.jpg' && agent.profilePhoto.startsWith('data:image/')) {
      return agent.profilePhoto;
    }
    return null;
  });
  const [defaultAvatar, setDefaultAvatar] = useState<string | null>(null);

  // Generate default avatar on component mount
  useEffect(() => {
    if (agent.profilePhoto === 'null_profile.jpg' && !defaultAvatar) {
      generateDefaultAvatar().then((base64) => {
        setDefaultAvatar(base64);
        // Update the database with the generated default avatar
        fetch(`/api/agents/${agent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: agent.title,
            description: agent.description,
            prompt: agent.prompt,
            tools: agent.tools,
            profilePhoto: base64,
          }),
        }).catch(console.error);
      });
    }
  }, [agent.profilePhoto, defaultAvatar, agent.id, agent.title, agent.description, agent.prompt, agent.tools]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAIAvatarDialog, setShowAIAvatarDialog] = useState(false);
  const [aiImageDescription, setAiImageDescription] = useState('');
  const [isGeneratingAIAvatar, setIsGeneratingAIAvatar] = useState(false);
  const [generatedAIImage, setGeneratedAIImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Generate avatar gradient based on agent title
  const getAvatarGradient = (title: string) => {
    const gradients = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600',
      'from-emerald-500 to-green-600',
      'from-amber-500 to-orange-600',
      'from-violet-500 to-purple-600',
    ];
    const hash = title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return gradients[Math.abs(hash) % gradients.length];
  };

  // Generate avatar icon based on agent title
  const getAvatarIcon = (title: string) => {
    const icons = [Bot, Brain, Zap, Code, Search, MessageSquare, FileText, Database, Globe];
    const hash = title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return icons[Math.abs(hash) % icons.length];
  };

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

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/edit/${agent.id}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB - we'll resize to 100x100 anyway)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          // Create a square crop and resize to 100x100 for optimal performance
          const size = Math.min(img.width, img.height);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas to 100x100 for fast loading
          canvas.width = 100;
          canvas.height = 100;
          
          if (ctx) {
            // Calculate crop area to center the square
            const x = (img.width - size) / 2;
            const y = (img.height - size) / 2;
            
            // Draw the square crop resized to 100x100 for optimal performance
            ctx.drawImage(img, x, y, size, size, 0, 0, 100, 100);
            // Use JPEG with 80% quality for much smaller file size (~5-10KB vs 50KB+)
            const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
            
            // Update the database
            const response = await fetch(`/api/agents/${agent.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: agent.title,
                description: agent.description,
                prompt: agent.prompt,
                tools: agent.tools,
                profilePhoto: croppedImage,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to update profile photo');
            }

            setAvatarImage(croppedImage);
            
            toast({
              title: "Avatar updated!",
              description: "Your agent avatar has been updated.",
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Could not update profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setAvatarImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Avatar removed",
      description: "Your agent avatar has been removed.",
    });
  };

  const handleGenerateAIAvatar = async () => {
    if (!aiImageDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAIAvatar(true);
    setGeneratedAIImage(null);

    try {
      const response = await fetch('/api/ai-generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentTitle: agent.title,
          agentDescription: agent.description,
          imageDescription: aiImageDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI avatar');
      }

      const data = await response.json();
      console.log('AI Avatar response:', data);
      setGeneratedAIImage(data.imageUrl);
      
      toast({
        title: "AI Avatar Generated!",
        description: "Your AI-generated avatar is ready. You can approve or regenerate it.",
      });
    } catch (error) {
      console.error('Error generating AI avatar:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAIAvatar(false);
    }
  };

  const handleApproveAIAvatar = async () => {
    if (!generatedAIImage) return;

    setIsUploading(true);

    try {
      // Since generatedAIImage is already base64, we can process it directly
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, 100, 100);
          const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
          
          // Update the database
          const updateResponse = await fetch(`/api/agents/${agent.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: agent.title,
              description: agent.description,
              prompt: agent.prompt,
              tools: agent.tools,
              profilePhoto: croppedImage,
            }),
          });

          if (!updateResponse.ok) {
            throw new Error('Failed to update profile photo');
          }

          setAvatarImage(croppedImage);
          setShowAIAvatarDialog(false);
          setGeneratedAIImage(null);
          setAiImageDescription('');
          setIsUploading(false);
          
          toast({
            title: "Avatar Updated!",
            description: "Your AI-generated avatar has been applied.",
          });
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load generated image');
        toast({
          title: "Image Error",
          description: "Failed to load the generated image. Please try again.",
          variant: "destructive",
        });
        setIsUploading(false);
      };
      
      img.src = generatedAIImage;
    } catch (error) {
      console.error('Error applying AI avatar:', error);
      toast({
        title: "Update Failed",
        description: "Failed to apply AI avatar. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleRegenerateAIAvatar = () => {
    setGeneratedAIImage(null);
    handleGenerateAIAvatar();
  };

  const handleAutoGenerateAIAvatar = async () => {
    setIsGeneratingAIAvatar(true);
    setGeneratedAIImage(null);

    try {
      const response = await fetch('/api/ai-generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentTitle: agent.title,
          agentDescription: agent.description,
          imageDescription: `A professional avatar for an AI agent named "${agent.title}". ${agent.description ? `This agent: ${agent.description}` : ''} Create a modern, clean, and distinctive avatar that represents this AI agent.`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI avatar');
      }

      const data = await response.json();
      console.log('Auto AI Avatar response:', data);
      setGeneratedAIImage(data.imageUrl);
      
      toast({
        title: "AI Avatar Generated!",
        description: "Your AI-generated avatar is ready. You can approve or regenerate it.",
      });
    } catch (error) {
      console.error('Error generating AI avatar:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAIAvatar(false);
    }
  };

  const handleStarsChange = async (newStars: number) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: agent.id,
          stars: newStars,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stars');
      }

      setStars(newStars);
      // Trigger a refresh of the agent list to update rankings
      onStarsChange?.();
    } catch (error) {
      console.error('Error updating stars:', error);
      toast({
        title: "Failed to update stars",
        description: "Could not update star rating",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start gap-3">
          {/* Agent Avatar */}
          <div className="flex-shrink-0 relative group">
            <Avatar className="w-16 h-16 rounded-lg">
              {avatarImage ? (
                <AvatarImage 
                  src={avatarImage} 
                  alt={agent.title} 
                  className="rounded-lg" 
                  loading="lazy"
                  onLoad={() => {
                    // Image loaded successfully
                  }}
                  onError={() => {
                    // Fallback to gradient if image fails to load
                    setAvatarImage(null);
                  }}
                />
              ) : defaultAvatar ? (
                <AvatarImage 
                  src={defaultAvatar} 
                  alt={agent.title} 
                  className="rounded-lg" 
                  loading="lazy"
                />
              ) : (
                <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(agent.title)} rounded-lg`}>
                  {(() => {
                    const IconComponent = getAvatarIcon(agent.title);
                    return <IconComponent className="h-8 w-8 text-white" />;
                  })()}
                </AvatarFallback>
              )}
            </Avatar>
            
            {/* Upload overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isUploading}
                    className="h-8 w-8 p-0"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Camera className="mr-2 h-4 w-4" />
                    Device Upload
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAIAvatarDialog(true)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gen AI Avatar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl">{agent.title}</CardTitle>
            <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
          </div>
          
          <div className="flex gap-1 flex-shrink-0">
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
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 h-8 w-8 shrink-0"
              onClick={handleEdit}
              title="Edit agent"
            >
              <Edit className="h-4 w-4" />
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
          <div className="flex items-center justify-between">
            {agent.forkCount && agent.forkCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Users className="h-3 w-3" />
                <span>{agent.forkCount} fork{agent.forkCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="ml-auto">
              <StarRating 
                stars={stars} 
                onStarsChange={handleStarsChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/run/${agent.id}`} className="w-full">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
            View Agent
          </Button>
        </Link>
      </CardFooter>

      {/* AI Avatar Generation Dialog */}
      <Dialog open={showAIAvatarDialog} onOpenChange={setShowAIAvatarDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate AI Avatar</DialogTitle>
            <DialogDescription>
              Create a custom avatar for "{agent.title}" using AI image generation. Use "Auto Generate" for a quick avatar based on agent details, or "Custom Generate" for a specific description.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Describe the image you want (for Custom Generate only):
              </label>
              <Textarea
                value={aiImageDescription}
                onChange={(e) => setAiImageDescription(e.target.value)}
                placeholder="e.g., A futuristic robot with glowing blue eyes, digital art style"
                className="mt-2"
                rows={3}
              />
            </div>

            {generatedAIImage && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Generated Image:</label>
                <div className="border rounded-lg p-4 flex justify-center">
                  <img 
                    src={generatedAIImage} 
                    alt="Generated avatar" 
                    className="w-32 h-32 object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Failed to display generated image:', e);
                      toast({
                        title: "Image Display Error",
                        description: "Failed to display the generated image. Please try regenerating.",
                        variant: "destructive",
                      });
                    }}
                  />
                </div>
              </div>
            )}

            {isGeneratingAIAvatar && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="flex items-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Generating avatar...</span>
                </div>
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  ⚠️ Don't cancel or image generation will fail
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (isGeneratingAIAvatar) {
                  toast({
                    title: "Generation in Progress",
                    description: "Please wait for the current generation to complete before canceling.",
                    variant: "destructive",
                  });
                  return;
                }
                setShowAIAvatarDialog(false);
                setGeneratedAIImage(null);
                setAiImageDescription('');
              }}
              disabled={isGeneratingAIAvatar}
            >
              Cancel
            </Button>
            
            {!generatedAIImage && !isGeneratingAIAvatar && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleAutoGenerateAIAvatar}
                  className="flex-1"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Auto Generate
                </Button>
                <Button 
                  onClick={handleGenerateAIAvatar} 
                  disabled={!aiImageDescription.trim()}
                  className="flex-1"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Custom Generate
                </Button>
              </>
            )}

            {generatedAIImage && (
              <>
                <Button variant="outline" onClick={handleRegenerateAIAvatar}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                <Button onClick={handleApproveAIAvatar} disabled={isUploading}>
                  <Check className="mr-2 h-4 w-4" />
                  {isUploading ? 'Applying...' : 'Approve'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
