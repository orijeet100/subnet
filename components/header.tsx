import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Wand2 } from 'lucide-react';

interface HeaderProps {
  onGenerateCompleteAgent?: () => void;
  isGeneratingCompleteAgent?: boolean;
}

export function Header({ onGenerateCompleteAgent, isGeneratingCompleteAgent }: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="SubNet" width={40} height={40} />
          <span className="text-foreground text-2xl font-bold">SubNet</span>
        </Link>
        <div className="flex items-center gap-3">
          {onGenerateCompleteAgent && (
            <Button
              onClick={onGenerateCompleteAgent}
              disabled={isGeneratingCompleteAgent}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Complete Agent
            </Button>
          )}
          <Link href="/create">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer">
              Create Agent
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
