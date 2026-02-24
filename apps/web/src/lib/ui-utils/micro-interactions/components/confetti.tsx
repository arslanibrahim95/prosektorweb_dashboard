"use client";

import * as React from "react";
import { usePrefersReducedMotion } from "../hooks";

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    size: number;
    delay: number;
}

interface ConfettiProps {
    active: boolean;
    origin?: { x: number; y: number };
    particleCount?: number;
    colors?: string[];
    onComplete?: () => void;
    respectReducedMotion?: boolean;
}

const Confetti: React.FC<ConfettiProps> = ({
    active,
    origin = { x: 0.5, y: 0.5 },
    particleCount = 50,
    colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b", "#eb4d4b", "#6c5ce7"],
    onComplete,
    respectReducedMotion = true,
}) => {
    const [pieces, setPieces] = React.useState<ConfettiPiece[]>([]);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const prefersReducedMotion = usePrefersReducedMotion();

    // Skip confetti if reduced motion is preferred
    const shouldAnimate = !respectReducedMotion || !prefersReducedMotion;

    React.useEffect(() => {
        if (!active || !shouldAnimate) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            return;
        }

        const newPieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => {
            const colorIndex = Math.floor(Math.random() * colors.length);
            return {
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                rotation: Math.random() * 360,
                color: colors[colorIndex] ?? '#3b82f6',
                size: Math.random() * 8 + 4,
                delay: Math.random() * 0.3,
            };
        });
        setPieces(newPieces);

        timeoutRef.current = setTimeout(() => {
            setPieces([]);
            onComplete?.();
        }, 2000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [active, particleCount, colors, onComplete, shouldAnimate]);

    if (!active || pieces.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
            {pieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute animate-confetti"
                    style={{
                        left: `${origin.x * 100}%`,
                        top: `${origin.y * 100}%`,
                        width: piece.size,
                        height: piece.size,
                        backgroundColor: piece.color,
                        animationDelay: `${piece.delay}s`,
                        transform: `rotate(${piece.rotation}deg)`,
                    }}
                />
            ))}
        </div>
    );
};

export { Confetti };
export type { ConfettiProps, ConfettiPiece };
