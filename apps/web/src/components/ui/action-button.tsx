'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevIsSuccessRef = useRef(isSuccess);

  // Detect isSuccess transition (false -> true)
  useEffect(() => {
    const shouldShowSuccess = isSuccess && !prevIsSuccessRef.current;
    prevIsSuccessRef.current = isSuccess;

    if (shouldShowSuccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuccess(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setShowSuccess(false), successDuration);
    }
  }, [isSuccess, successDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

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
