/**
 * Builder Store - Zustand Store for Website Builder
 * 
 * Bu hook website builder için global state yönetimi sağlar.
 * Canvas durumu, seçili bileşenler, undo/redo geçmişi burada tutulur.
 * (Now largely refactored to use-builder-store.ts and use-builder-types.ts)
 */

import { useMemo } from 'react';
import deepmerge from 'deepmerge';
import { useBuilderStore } from './use-builder-store';
import {
    type BuilderComponent,
    type DeviceProps,
    type DeviceType,
    type DeviceVisibility,
    type LayoutData,
    type PageInfo,
    type CanvasSection,
    type HistoryEntry,
} from './use-builder-types';

// Re-export types for convenience
export type { BuilderComponent, DeviceProps, DeviceType, DeviceVisibility, LayoutData, PageInfo, CanvasSection, HistoryEntry };
export { useBuilderStore } from './use-builder-store';

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * useBuilder - Ana builder hook'u
 * PERFORMANCE FIX: Returns the full store but callers should prefer
 * granular hooks (useBuilderLayout, useBuilderActions, etc.) to avoid
 * unnecessary re-renders.
 */
export function useBuilder() {
    return useBuilderStore();
}

/**
 * Granular selector hooks — subscribe only to the slice you need.
 */
export function useBuilderLayout() {
    return useBuilderStore((s) => s.layoutData);
}

export function useBuilderLoading() {
    return useBuilderStore((s) => s.isLoading);
}

export function useBuilderSelection() {
    return useBuilderStore((s) => ({
        selectedComponentId: s.selectedComponentId,
        selectedRegion: s.selectedRegion,
        setSelectedComponent: s.setSelectedComponent,
    }));
}

/**
 * useSelectedComponent - Seçili bileşen
 * PERFORMANCE FIX: useMemo for referential stability — downstream
 * components only re-render when the actual selected component changes.
 */
export function useSelectedComponent(): BuilderComponent | null {
    // Use Zustand selectors to prevent re-renders on unrelated state changes
    const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);
    const components = useBuilderStore((s) => s.layoutData.components);

    return useMemo(() => {
        if (!selectedComponentId) return null;

        const findComponent = (
            comps: BuilderComponent[],
            id: string
        ): BuilderComponent | null => {
            for (const component of comps) {
                if (component.id === id) return component;
                if (component.children) {
                    const found = findComponent(component.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        return findComponent(components, selectedComponentId);
    }, [components, selectedComponentId]);
}

/**
 * useHistory - Undo/redo kontrolü
 * PERFORMANCE FIX: Granular selectors instead of full store subscription.
 */
export function useHistory() {
    const canUndo = useBuilderStore((s) => s.canUndo);
    const canRedo = useBuilderStore((s) => s.canRedo);
    const undo = useBuilderStore((s) => s.undo);
    const redo = useBuilderStore((s) => s.redo);
    return { canUndo, canRedo, undo, redo };
}

/**
 * getEffectiveProps - Device'a özel özellikleri birleştirir
 * 
 * Base props + device-specific props + current device override
 */
export function getEffectiveProps(
    baseProps: Record<string, unknown>,
    deviceProps: DeviceProps | undefined,
    currentDevice: DeviceType,
    deviceOverrides: Record<string, unknown> | undefined
): Record<string, unknown> {
    let effectiveProps = { ...baseProps };

    // Apply device-specific props using deepmerge to prevent shallow reference bleeds (style leaks)
    if (deviceProps) {
        const deviceSpecificProps = deviceProps[currentDevice];
        if (deviceSpecificProps) {
            effectiveProps = deepmerge(effectiveProps, deviceSpecificProps);
        }
    }

    // Apply live device overrides (from editing)
    if (deviceOverrides) {
        effectiveProps = deepmerge(effectiveProps, deviceOverrides);
    }

    return effectiveProps;
}

/**
 * isComponentVisible - Bileşenin mevcut cihazda görünüp görünmeyeceğini kontrol eder
 */
export function isComponentVisible(
    visibility: DeviceVisibility | undefined,
    currentDevice: DeviceType
): boolean {
    if (!visibility) return true;

    // Default: visible if not explicitly set to false
    if (visibility[currentDevice] === undefined) return true;

    return visibility[currentDevice] === true;
}
