import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * 2026 Card Component
 * 
 * Trend Rationale:
 * - Glassmorphism: Premium blur effect
 * - Neomorphism: Soft UI depth
 * - Hover lift: Interactive feel
 * - Gradient variants: Modern visual hierarchy
 */

function Card({
  className,
  variant = "default",
  hover = false,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "glass" | "neo" | "gradient"
  hover?: boolean
}) {
  const variantClasses = {
    default: "bg-card text-card-foreground border-border",
    glass: "glass bg-card/60 text-card-foreground",
    neo: "neo bg-card text-card-foreground border-transparent",
    gradient: "gradient-mesh bg-card text-card-foreground border-border/50",
  }

  const hoverClass = hover
    ? "hover-lift cursor-pointer"
    : ""

  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        "flex flex-col gap-6 rounded-2xl border py-6 shadow-sm transition-all duration-300",
        variantClasses[variant],
        hoverClass,
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-tight font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm leading-relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

/**
 * 2026: Interactive Card Components
 */

function GlassCard({ className, hover = false, ...props }: React.ComponentProps<"div"> & { hover?: boolean }) {
  const hoverClass = hover
    ? "hover-lift cursor-pointer hover:shadow-glass-strong"
    : "hover:shadow-glass"

  return (
    <div
      data-slot="glass-card"
      className={cn(
        "glass rounded-2xl border border-white/10 p-6 transition-all duration-300",
        hoverClass,
        className
      )}
      {...props}
    />
  )
}

function NeoCard({ className, hover = false, ...props }: React.ComponentProps<"div"> & { hover?: boolean }) {
  const hoverClass = hover
    ? "hover-lift cursor-pointer"
    : ""

  return (
    <div
      data-slot="neo-card"
      className={cn(
        "neo rounded-2xl p-6 transition-all duration-300",
        hoverClass,
        className
      )}
      {...props}
    />
  )
}

function GradientCard({ className, hover = false, ...props }: React.ComponentProps<"div"> & { hover?: boolean }) {
  const hoverClass = hover
    ? "hover-lift cursor-pointer hover:shadow-glow-primary"
    : ""

  return (
    <div
      data-slot="gradient-card"
      className={cn(
        "gradient-mesh rounded-2xl border border-white/10 p-6 transition-all duration-300",
        hoverClass,
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  // 2026 variants
  GlassCard,
  NeoCard,
  GradientCard,
}
