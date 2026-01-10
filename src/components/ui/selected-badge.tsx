import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedBadgeProps {
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
}

export const SelectedBadge: React.FC<SelectedBadgeProps> = ({
  children,
  selected = false,
  className
}) => {
  if (!selected) return null;
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center gap-1",
        className
      )}
    >
      <CheckCircle2 className="h-3 w-3" />
      {children}
    </Badge>
  );
};
