import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface RequiredLabelProps extends React.ComponentProps<typeof Label> {
  required?: boolean;
  children: React.ReactNode;
}

export const RequiredLabel: React.FC<RequiredLabelProps> = ({
  required = false,
  children,
  className,
  ...props
}) => {
  return (
    <Label className={cn("text-sm font-medium", className)} {...props}>
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );
};
