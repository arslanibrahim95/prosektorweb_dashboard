'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

interface ActionButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  successDuration?: number;
  loadingLabel?: string;
  successLabel?: string;
}

export function ActionButton({
  isLoading = false,
  isSuccess = false,
  successDuration = 2000,
  loadingLabel,
  successLabel = 'Kaydedildi',
  children,
  disabled,
  className,
  ...props
}: ActionButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const prevSuccessRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Detect isSuccess transition (false -> true) without useEffect
  if (isSuccess && !prevSuccessRef.current) {
    setShowSuccess(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowSuccess(false), successDuration);
  }
  prevSuccessRef.current = isSuccess;

  // Cleanup on unmount
  const cleanupRef = useCallback(() => {
    return () => clearTimeout(timerRef.current);
  }, []);
  // Store cleanup ref for React to call
  React.useEffect(cleanupRef, [cleanupRef]);

  return (
    <Button
      disabled={disabled || isLoading}
      className={cn(
        'transition-all duration-200',
        showSuccess && 'bg-success hover:bg-success text-success-foreground',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingLabel ?? children}
        </>
      ) : showSuccess ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4 animate-[success-pop_0.3s_ease-out]" />
          {successLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
