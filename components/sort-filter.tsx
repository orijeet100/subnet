'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ArrowUpDown, Star, Clock, TrendingUp } from 'lucide-react';

export type SortOption = 'recent' | 'az' | 'forks' | 'leaderboard';

interface SortFilterProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions = [
  { value: 'recent' as const, label: 'Most Recent', icon: Clock },
  { value: 'az' as const, label: 'A-Z', icon: ArrowUpDown },
  { value: 'forks' as const, label: 'Most Forks', icon: TrendingUp },
  { value: 'leaderboard' as const, label: 'Leaderboard', icon: Star },
];

export function SortFilter({ currentSort, onSortChange }: SortFilterProps) {
  const currentOption = sortOptions.find(option => option.value === currentSort);
  const Icon = currentOption?.icon || Clock;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icon className="h-4 w-4" />
          {currentOption?.label}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortOptions.map((option) => {
          const OptionIcon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className="gap-2"
            >
              <OptionIcon className="h-4 w-4" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
