'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { formatTimeRemaining } from '@/lib/auth/token-refresh';
import { cn } from '@/lib/utils';

/**
 * Session Timeout Alert Component
 *
 * Shows a warning when the session is about to expire.
 * - Yellow warning at 5 minutes
 * - Red critical warning at 1 minute
 */

interface SessionTimeoutAlertProps {
  className?: string;
}

export function SessionTimeoutAlert({ className }: SessionTimeoutAlertProps) {
  const { sessionWarning, extendSession, signOut, status } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  // Update local timer
  useEffect(() => {
    if (!sessionWarning.show || sessionWarning.timeUntilExpiry <= 0) {
      setIsOpen(false);
      setLocalTimeRemaining(0);
      return;
    }

    // Show alert based on warning level
    if (sessionWarning.level === 'warning' || sessionWarning.level === 'critical') {
      setIsOpen(true);
    }

    // Update every second
    const interval = setInterval(() => {
      setLocalTimeRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionWarning.show, sessionWarning.level, sessionWarning.timeUntilExpiry]);

  // Auto-hide on warning level (not critical) after being acknowledged
  const handleDismiss = useCallback(() => {
    if (sessionWarning.level === 'warning') {
      setIsOpen(false);
    }
  }, [sessionWarning.level]);

  // Handle extend session
  const handleExtend = useCallback(async () => {
    setIsExtending(true);
    try {
      await extendSession();
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to extend session:', err);
    } finally {
      setIsExtending(false);
    }
  }, [extendSession]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsOpen(false);
    await signOut();
    router.push('/login?reason=session_expired');
  }, [signOut, router]);

  // Don't render if not authenticated or no warning
  if (status !== 'authenticated' || !isOpen || localTimeRemaining <= 0) {
    return null;
  }

  const isCritical = sessionWarning.level === 'critical';
  const timeString = formatTimeRemaining(localTimeRemaining);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-full fade-in duration-300',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          'rounded-lg border shadow-lg p-4 space-y-3',
          isCritical
            ? 'bg-destructive/10 border-destructive/50'
            : 'bg-warning/10 border-warning/50'
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'shrink-0',
              isCritical ? 'text-destructive' : 'text-warning-foreground'
            )}
          >
            {isCritical ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 space-y-1">
            <h4
              className={cn(
                'font-semibold text-sm',
                isCritical ? 'text-destructive' : 'text-warning-foreground'
              )}
            >
              {isCritical ? 'Oturum Sona Eriyor!' : 'Oturum Uyarısı'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isCritical ? (
                <>
                  Oturumunuz <span className="font-semibold text-destructive">{timeString}</span>{' '}
                  içinde sona erecek. Çalışmanız kaydedilmeyebilir.
                </>
              ) : (
                <>
                  Oturumunuz <span className="font-semibold">{timeString}</span> sonra
                  sona erecek. Oturumu uzatmak isterseniz aşağıdaki butona tıklayın.
                </>
              )}
            </p>
          </div>

          {/* Close button (only for warning level) */}
          {!isCritical && (
            <button
              onClick={handleDismiss}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className={cn('flex gap-2', isCritical ? 'flex-col-reverse' : 'flex-row')}>
          <Button
            variant={isCritical ? 'outline' : 'ghost'}
            size="sm"
            onClick={handleLogout}
            className={cn(
              'flex-1',
              isCritical && 'border-destructive/50 text-destructive hover:bg-destructive/20'
            )}
          >
            Çıkış Yap
          </Button>
          <Button
            variant={isCritical ? 'destructive' : 'default'}
            size="sm"
            onClick={handleExtend}
            disabled={isExtending}
            className="flex-1"
          >
            {isExtending ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Uzatılıyor...
              </span>
            ) : (
              'Oturumu Uzat'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact session timeout indicator for the top bar
 */
export function SessionTimeoutIndicator() {
  const { sessionWarning, status } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!sessionWarning.show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeRemaining(0);
      return;
    }

    // Set initial time
    setTimeRemaining(sessionWarning.timeUntilExpiry);

    // Start interval
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionWarning.show, sessionWarning.timeUntilExpiry]);

  if (status !== 'authenticated' || !sessionWarning.show) {
    return null;
  }

  const isCritical = sessionWarning.level === 'critical';
  const timeString = formatTimeRemaining(timeRemaining);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
        isCritical
          ? 'bg-destructive/10 text-destructive border border-destructive/50'
          : 'bg-warning/10 text-warning-foreground border border-warning/50'
      )}
    >
      {isCritical ? (
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>{timeString}</span>
    </div>
  );
}

/**
 * Inline session warning banner (for dashboard layout)
 */
interface InlineSessionWarningProps {
  className?: string;
}

export function InlineSessionWarning({ className }: InlineSessionWarningProps) {
  const { sessionWarning, extendSession, signOut, status } = useAuth();
  const [localTimeRemaining, setLocalTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (!sessionWarning.show) {
      setLocalTimeRemaining(0);
      return;
    }

    setLocalTimeRemaining(sessionWarning.timeUntilExpiry);

    const interval = setInterval(() => {
      setLocalTimeRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionWarning.show, sessionWarning.timeUntilExpiry]);

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      await extendSession();
    } finally {
      setIsExtending(false);
    }
  };

  if (status !== 'authenticated' || !sessionWarning.show) {
    return null;
  }

  const isCritical = sessionWarning.level === 'critical';
  const timeString = formatTimeRemaining(localTimeRemaining);

  return (
    <div
      className={cn(
        'w-full px-4 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-top',
        isCritical
          ? 'bg-destructive/10 border-b border-destructive/50'
          : 'bg-warning/10 border-b border-warning/50',
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {isCritical ? (
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-warning-foreground shrink-0" />
        )}
        <div className="text-sm">
          <span
            className={cn(
              'font-medium',
              isCritical ? 'text-destructive' : 'text-warning-foreground'
            )}
          >
            {isCritical ? 'Oturum kritik seviyede:' : 'Oturum uyarısı:'}
          </span>{' '}
          <span className="text-muted-foreground">
            {timeString} sonra sona erecek.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="h-8 text-xs"
        >
          Çıkış
        </Button>
        <Button
          variant={isCritical ? 'destructive' : 'default'}
          size="sm"
          onClick={handleExtend}
          disabled={isExtending}
          className="h-8"
        >
          {isExtending ? 'Uzatılıyor...' : 'Uzat'}
        </Button>
      </div>
    </div>
  );
}
