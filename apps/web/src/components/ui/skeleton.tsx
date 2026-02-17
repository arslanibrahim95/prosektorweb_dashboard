import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * 2026 Skeleton Component
 * 
 * Trend Rationale:
 * - Enhanced shimmer effects with diagonal gradient
 * - Glass skeleton for premium feel
 * - Multiple shimmer variants
 */

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "shimmer" | "shimmer-diagonal" | "glass"
}) {
  const variantClasses = {
    default: "bg-accent animate-pulse",
    shimmer: "shimmer-skeleton",
    "shimmer-diagonal": "shimmer-skeleton-diagonal",
    glass: "glass bg-white/5 animate-pulse",
  }

  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      className={cn(
        "rounded-lg",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

/**
 * 2026: Skeleton Card
 */
function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border bg-card p-6 space-y-4", className)}
      {...props}
    >
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  )
}

/**
 * 2026: Skeleton Avatar
 */
function SkeletonAvatar({ className, size = "default", ...props }: React.ComponentProps<"div"> & {
  size?: "sm" | "default" | "lg" | "xl"
}) {
  const sizeClasses = {
    sm: "h-8 w-8 rounded-full",
    default: "h-10 w-10 rounded-full",
    lg: "h-14 w-14 rounded-full",
    xl: "h-20 w-20 rounded-full",
  }

  return (
    <Skeleton
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  )
}

/**
 * 2026: Skeleton Text Lines
 */
function SkeletonText({
  lines = 3,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  lines?: number
}) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
          variant="shimmer-diagonal"
        />
      ))}
    </div>
  )
}

/**
 * 2026: Skeleton Button
 */
function SkeletonButton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton
      className={cn("h-10 w-24 rounded-lg", className)}
      {...props}
    />
  )
}

/**
 * 2026: Skeleton Input
 */
function SkeletonInput({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton
      className={cn("h-10 w-full rounded-lg", className)}
      {...props}
    />
  )
}

export { Skeleton, SkeletonCard, SkeletonAvatar, SkeletonText, SkeletonButton, SkeletonInput }
