"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * 2026 Tilt Card Component
 * 
 * Trend Rationale:
 * - 3D perspective for depth and premium feel
 * - Mouse-based tilt interaction
 * - Smooth spring animations
 * - Glassmorphism surface
 * 
 * Usage:
 * <TiltCard>Tiltable content</TiltCard>
 */

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Tilt intensity (0-1) */
    intensity?: number
    /** Enable spring animation */
    spring?: boolean
    /** Glass effect variant */
    glass?: boolean
    /** Glow on hover */
    glow?: boolean
    /** Tilt perspective value */
    perspective?: number
}

function TiltCard({
    className,
    intensity = 0.1,
    spring = true,
    glass = true,
    glow = false,
    perspective = 1000,
    children,
    ...props
}: TiltCardProps) {
    const [transform, setTransform] = React.useState({
        rotateX: 0,
        rotateY: 0,
    })
    const [isHovered, setIsHovered] = React.useState(false)

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        const rotateX = ((y - centerY) / centerY) * -intensity * 20
        const rotateY = ((x - centerX) / centerX) * intensity * 20

        setTransform({ rotateX, rotateY })
    }, [intensity])

    const handleMouseLeave = React.useCallback(() => {
        setTransform({ rotateX: 0, rotateY: 0 })
        setIsHovered(false)
    }, [])

    const handleMouseEnter = React.useCallback(() => {
        setIsHovered(true)
    }, [])

    return (
        <div
            className={cn(
                "relative preserve-3d transition-all duration-200",
                glass && "glass",
                glow && isHovered && "shadow-glow-primary",
                className
            )}
            style={{
                perspective: `${perspective}px`,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            {...props}
        >
            <div
                className={cn(
                    "transition-transform duration-200",
                    spring && isHovered ? "ease-spring" : "ease-out"
                )}
                style={{
                    transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
                }}
            >
                {children}
            </div>
        </div>
    )
}

/**
 * 2026: 3D Flip Card
 * 
 * Front and back faces with flip animation
 */

interface FlipCardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Front content */
    front: React.ReactNode
    /** Back content */
    back: React.ReactNode
    /** Auto flip on hover */
    flipOnHover?: boolean
}

function FlipCard({
    className,
    front,
    back,
    flipOnHover = false,
    ...props
}: FlipCardProps) {
    const [isFlipped, setIsFlipped] = React.useState(false)

    return (
        <div
            className={cn(
                "relative preserve-3d w-full h-full",
                flipOnHover && "cursor-pointer",
                className
            )}
            style={{ perspective: "1000px" }}
            onMouseEnter={() => flipOnHover && setIsFlipped(true)}
            onMouseLeave={() => flipOnHover && setIsFlipped(false)}
            onClick={() => !flipOnHover && setIsFlipped(!isFlipped)}
            {...props}
        >
            {/* Front */}
            <div
                className={cn(
                    "absolute inset-0 backface-hidden transition-all duration-500",
                    isFlipped && "opacity-0 rotate-y-180"
                )}
                style={{ transformStyle: "preserve-3d" }}
            >
                {front}
            </div>

            {/* Back */}
            <div
                className={cn(
                    "absolute inset-0 backface-hidden transition-all duration-500 rotate-y-180",
                    !isFlipped && "opacity-0 -rotate-y-180"
                )}
                style={{ transformStyle: "preserve-3d" }}
            >
                {back}
            </div>
        </div>
    )
}

/**
 * 2026: Parallax Container
 * 
 * Mouse-based parallax effect for backgrounds
 */

interface ParallaxProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Parallax intensity (0-1) */
    intensity?: number
    children: React.ReactNode
}

function ParallaxContainer({
    className,
    intensity = 0.1,
    children,
    ...props
}: ParallaxProps) {
    const [offset, setOffset] = React.useState({ x: 0, y: 0 })

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5

        setOffset({
            x: x * intensity * 40,
            y: y * intensity * 40,
        })
    }, [intensity])

    const handleMouseLeave = React.useCallback(() => {
        setOffset({ x: 0, y: 0 })
    }, [])

    return (
        <div
            className={cn("relative overflow-hidden", className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            <div
                className="transition-transform duration-100 ease-out"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
            >
                {children}
            </div>
        </div>
    )
}

/**
 * 2026: 3D Float Animation
 * 
 * Continuous floating animation with optional 3D rotation
 */

interface Float3DProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Float animation duration */
    duration?: number
    /** 3D rotation angle */
    rotation?: number
    /** Animation delay in seconds */
    delay?: number
    children: React.ReactNode
}

function Float3D({
    className,
    duration = 3,
    rotation = 0,
    delay = 0,
    children,
    ...props
}: Float3DProps) {
    return (
        <div
            className={cn("animate-float", className)}
            style={{
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                transform: `perspective(1000px) rotateX(${rotation}deg)`,
            }}
            {...props}
        >
            {children}
        </div>
    )
}

export { TiltCard, FlipCard, ParallaxContainer, Float3D }
