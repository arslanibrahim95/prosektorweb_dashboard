import React from 'react';

// ============================================================================
// Helper to cast component types securely for the registry
// ============================================================================
export function asRegistryComponent<TProps>(
    component: React.ComponentType<TProps>
): React.ComponentType<Record<string, unknown>> {
    return component as unknown as React.ComponentType<Record<string, unknown>>;
}
