'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Branded skeleton that mirrors the AppShell layout (sidebar + topbar + content).
 * Replaces blank white screens during auth loading states.
 */
export function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar skeleton */}
      <aside className="hidden md:flex w-[var(--sidebar-width,260px)] flex-col border-r border-border/50 bg-card/50 p-4 gap-4">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-2 py-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>

        {/* Nav items */}
        <div className="space-y-1 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4" style={{ width: `${70 + (i * 17) % 50}px` }} />
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-auto space-y-2">
          <Skeleton className="h-8 w-full rounded-lg" />
          <div className="flex items-center gap-2 px-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar skeleton */}
        <header className="h-[var(--topbar-height,64px)] border-b border-border/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded md:hidden" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        {/* Page content skeleton */}
        <main className="flex-1 p-6 space-y-6">
          {/* Page title */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>

          {/* Content block */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-4">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
