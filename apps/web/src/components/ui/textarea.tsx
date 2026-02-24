import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styling
        "flex w-full min-h-[80px] rounded-lg border border-input bg-background px-4 py-3 text-base shadow-sm",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground/70 text-foreground",
        // Transitions
        "transition-all duration-300 ease-in-out outline-none resize-y",
        // Hover state
        "hover:border-primary/40 hover:bg-muted/10",
        // Focus state (Glow & Ring)
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:shadow-[0_0_15px_rgba(var(--primary),0.15)]",
        // Error state
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30 aria-invalid:shadow-[0_0_15px_rgba(var(--destructive),0.15)]",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input disabled:hover:bg-background",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

