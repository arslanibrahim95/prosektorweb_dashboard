'use client';

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CelebrationProps {
  trigger: boolean;
  variant?: 'confetti' | 'sparkle';
  duration?: number;
  className?: string;
}

/**
 * CSS-only celebration animation.
 * - confetti: Colored dots falling from above
 * - sparkle: Glowing stars that scale and fade
 */
export function Celebration({
  trigger,
  variant = 'confetti',
  duration = 2000,
  className,
}: CelebrationProps) {
  const [active, setActive] = useState(false);
  const prevTriggerRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Detect trigger transition (false -> true) without useEffect
  if (trigger && !prevTriggerRef.current) {
    setActive(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(false), duration);
  }
  prevTriggerRef.current = trigger;

  // Cleanup on unmount
  const cleanupRef = useCallback(() => {
    return () => clearTimeout(timerRef.current);
  }, []);
  React.useEffect(cleanupRef, [cleanupRef]);

  if (!active) return null;

  if (variant === 'sparkle') {
    return (
      <div className={cn('pointer-events-none fixed inset-0 z-50 overflow-hidden', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-[sparkle-float_1.5s_ease-out_forwards]"
            style={{
              left: `${20 + (i * 67 % 60)}%`,
              top: `${30 + (i * 37 % 40)}%`,
              animationDelay: `${i * 100}ms`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 0L12.5 7.5L20 10L12.5 12.5L10 20L7.5 12.5L0 10L7.5 7.5Z"
                fill="oklch(0.75 0.18 85)"
                opacity="0.8"
              />
            </svg>
          </div>
        ))}
      </div>
    );
  }

  // Confetti variant
  const colors = [
    'oklch(0.55 0.20 250)', // primary blue
    'oklch(0.62 0.17 145)', // green
    'oklch(0.75 0.18 85)',  // yellow
    'oklch(0.65 0.16 250)', // light blue
    'oklch(0.60 0.20 350)', // pink
  ];

  return (
    <div className={cn('pointer-events-none fixed inset-0 z-50 overflow-hidden', className)}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-[confetti-fall_2s_ease-in_forwards]"
          style={{
            left: `${(i * 37 + 5) % 100}%`,
            top: '-10px',
            backgroundColor: colors[i % colors.length],
            animationDelay: `${(i * 70) % 500}ms`,
            transform: `rotate(${i * 47}deg)`,
          }}
        />
      ))}
    </div>
  );
}
