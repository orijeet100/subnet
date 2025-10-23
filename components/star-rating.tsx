'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ChevronUp, ChevronDown } from 'lucide-react';

interface StarRatingProps {
  stars: number;
  onStarsChange: (newStars: number) => void;
  disabled?: boolean;
}

export function StarRating({ stars, onStarsChange, disabled = false }: StarRatingProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStarChange = async (increment: number) => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    const newStars = Math.max(0, stars + increment);
    await onStarsChange(newStars);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStarChange(-1)}
          disabled={disabled || isLoading || stars <= 0}
          className="h-6 w-6 p-0 hover:bg-yellow-100"
        >
          <ChevronDown className="h-3 w-3 text-yellow-600" />
        </Button>
        
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-medium text-yellow-700">{stars}</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStarChange(1)}
          disabled={disabled || isLoading}
          className="h-6 w-6 p-0 hover:bg-yellow-100"
        >
          <ChevronUp className="h-3 w-3 text-yellow-600" />
        </Button>
      </div>
    </div>
  );
}
