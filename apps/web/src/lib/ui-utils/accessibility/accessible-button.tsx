"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const accessibleButtonVariants = cva(
    [
        "inline-flex items-center justify-center gap-2",
        "rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-busy:cursor-wait",
    ],
    {
        variants: {
            variant: {
                default: [
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90",
                    "focus-visible:ring-primary",
                ],
                secondary: [
                    "bg-secondary text-secondary-foreground",
                    "hover:bg-secondary/80",
                    "focus-visible:ring-secondary",
                ],
                ghost: [
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:ring-accent",
                ],
                outline: [
                    "border border-input bg-background",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:ring-accent",
                ],
                destructive: [
                    "bg-destructive text-destructive-foreground",
                    "hover:bg-destructive/90",
                    "focus-visible:ring-destructive",
                ],
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 px-3 text-sm",
                lg: "h-11 px-8 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

interface AccessibleButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accessibleButtonVariants> {
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    description?: string;
}

const AccessibleButton = React.forwardRef<
    HTMLButtonElement,
    AccessibleButtonProps
>(
    (
        {
            className,
            variant,
            size,
            isLoading,
            loadingText,
            leftIcon,
            rightIcon,
            description,
            children,
            disabled,
            "aria-label": ariaLabel,
            "aria-describedby": ariaDescribedBy,
            ...props
        },
        ref
    ) => {
        const descriptionId = React.useId();
        const hasDescription = !!description;

        return (
            <>
                <button
                    ref={ref}
                    className={cn(accessibleButtonVariants({ variant, size, className }))}
                    disabled={disabled || isLoading}
                    aria-label={ariaLabel}
                    aria-describedby={hasDescription ? descriptionId : ariaDescribedBy}
                    aria-busy={isLoading}
                    aria-disabled={disabled || isLoading}
                    {...props}
                >
                    {isLoading ? (
                        <>
                            <span
                                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                                aria-hidden="true"
                            />
                            <span className="sr-only">{loadingText || "Loading"}</span>
                            {loadingText || children}
                        </>
                    ) : (
                        <>
                            {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
                            {children}
                            {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
                        </>
                    )}
                </button>
                {hasDescription && (
                    <span id={descriptionId} className="sr-only">
                        {description}
                    </span>
                )}
            </>
        );
    }
);
AccessibleButton.displayName = "AccessibleButton";

export { AccessibleButton, accessibleButtonVariants };
export type { AccessibleButtonProps };
