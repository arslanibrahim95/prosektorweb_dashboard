/**
 * Micro-Interactions Library - Production Ready
 * 
 * Features:
 * - XSS-safe animation values
 * - RAF throttling to prevent re-render storms
 * - Memory leak free
 * - Reduced motion support
 * - Error handling
 * 
 * @module micro-interactions
 * @version 2.0.0
 */

// Configuration
export { ANIMATION_CONFIG } from './config';

// Hooks
export { usePrefersReducedMotion, useThrottledAnimation } from './hooks';

// Components
export {
    StaggerContainer,
    MagneticButton,
    TextReveal,
    CountUp,
    Shimmer,
    SkeletonCard,
    PageTransition,
    HoverLift,
    Confetti,
    PulseRing,
    MorphingIcon,
} from './components';

// Types
export type {
    StaggerContainerProps,
    MagneticButtonProps,
    TextRevealProps,
    CountUpProps,
    ShimmerProps,
    SkeletonCardProps,
    PageTransitionProps,
    HoverLiftProps,
    ConfettiProps,
    ConfettiPiece,
    PulseRingProps,
    MorphingIconProps,
} from './components';
