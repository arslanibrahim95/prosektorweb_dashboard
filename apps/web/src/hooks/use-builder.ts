/**
 * Builder Store - Zustand Store for Website Builder
 * 
 * Bu hook website builder için global state yönetimi sağlar.
 * Canvas durumu, seçili bileşenler, undo/redo geçmişi burada tutulur.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { api } from '@/server/api';
import { useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface DeviceVisibility {
    desktop?: boolean;
    tablet?: boolean;
    mobile?: boolean;
}

export interface DeviceProps {
    desktop?: Record<string, unknown>;
    tablet?: Record<string, unknown>;
    mobile?: Record<string, unknown>;
}

export interface BuilderComponent {
    id: string;
    type: string;
    name: string;
    props: Record<string, unknown>;
    children?: BuilderComponent[];
    styles?: Record<string, unknown>;
    // Responsive
    visibility?: DeviceVisibility;
    deviceProps?: DeviceProps;
}

export interface CanvasSection {
    id: string;
    region: string;
    components: BuilderComponent[];
}

export interface PageInfo {
    id: string;
    slug: string;
    title: string;
    siteId: string;
}

export interface LayoutData {
    components: BuilderComponent[];
    settings: Record<string, unknown>;
    breakpoints: Record<string, unknown>;
}

export interface HistoryEntry {
    layoutData: LayoutData;
    timestamp: number;
    description: string;
}

export interface BuilderState {
    // Page info
    pageInfo: PageInfo | null;
    setPageInfo: (page: PageInfo | null) => void;

    // Canvas data
    layoutData: LayoutData;
    setLayoutData: (data: LayoutData) => void;
    updateComponents: (components: BuilderComponent[]) => void;

    // Selection
    selectedComponentId: string | null;
    selectedRegion: string;
    setSelectedComponent: (id: string | null, region?: string) => void;

    // Component operations
    addComponent: (component: BuilderComponent, region?: string, index?: number) => void;
    removeComponent: (id: string) => void;
    updateComponentProps: (id: string, props: Record<string, unknown>) => void;
    moveComponent: (id: string, newIndex: number, newRegion?: string) => void;
    duplicateComponent: (id: string) => void;

    // Helper methods (internal)
    findComponent: (components: BuilderComponent[], id: string) => BuilderComponent | null;
    updateComponentInTree: (
        components: BuilderComponent[],
        id: string,
        updater: (c: BuilderComponent) => BuilderComponent
    ) => BuilderComponent[];
    removeComponentFromTree: (
        components: BuilderComponent[],
        id: string
    ) => BuilderComponent[];

    // Device preview
    currentDevice: DeviceType;
    setCurrentDevice: (device: DeviceType) => void;

    // Component device-specific props
    updateComponentVisibility: (id: string, visibility: DeviceVisibility) => void;
    updateComponentDeviceProps: (id: string, device: DeviceType, props: Record<string, unknown>) => void;

    // History (undo/redo)
    history: HistoryEntry[];
    historyIndex: number;
    pushHistory: (description: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Loading states
    isLoading: boolean;
    isSaving: boolean;
    isDirty: boolean;
    setLoading: (loading: boolean) => void;
    setSaving: (saving: boolean) => void;
    setDirty: (dirty: boolean) => void;

    // API
    saveLayout: () => Promise<void>;
    loadLayout: (pageId: string) => Promise<void>;
    publishLayout: () => Promise<void>;

    // Reset
    reset: () => void;
}

const initialLayoutData: LayoutData = {
    components: [],
    settings: {},
    breakpoints: {},
};

const initialState = {
    pageInfo: null,
    layoutData: initialLayoutData,
    selectedComponentId: null,
    selectedRegion: 'main',
    // Device preview
    currentDevice: 'desktop' as DeviceType,
    history: [],
    historyIndex: -1,
    isLoading: false,
    isSaving: false,
    isDirty: false,
};

// ============================================================================
// Store
// ============================================================================

export const useBuilderStore = create<BuilderState>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // Page info
                setPageInfo: (pageInfo) => set({ pageInfo }),

                // Layout data
                setLayoutData: (layoutData) => {
                    set({ layoutData, isDirty: true });
                },

                updateComponents: (components) => {
                    set((state) => ({
                        layoutData: {
                            ...state.layoutData,
                            components,
                        },
                        isDirty: true,
                    }));
                },

                // Selection
                setSelectedComponent: (selectedComponentId, region) => {
                    set({
                        selectedComponentId,
                        selectedRegion: region || get().selectedRegion,
                    });
                },

                // Helper: Find component in tree
                findComponent: (
                    components: BuilderComponent[],
                    id: string
                ): BuilderComponent | null => {
                    for (const component of components) {
                        if (component.id === id) return component;
                        if (component.children) {
                            const found = get().findComponent(component.children, id);
                            if (found) return found;
                        }
                    }
                    return null;
                },

                // Helper: Update component in tree
                updateComponentInTree: (
                    components: BuilderComponent[],
                    id: string,
                    updater: (c: BuilderComponent) => BuilderComponent
                ): BuilderComponent[] => {
                    return components.map((component) => {
                        if (component.id === id) {
                            return updater(component);
                        }
                        if (component.children) {
                            return {
                                ...component,
                                children: get().updateComponentInTree(
                                    component.children,
                                    id,
                                    updater
                                ),
                            };
                        }
                        return component;
                    });
                },

                // Helper: Remove component from tree
                removeComponentFromTree: (
                    components: BuilderComponent[],
                    id: string
                ): BuilderComponent[] => {
                    return components
                        .filter((component) => component.id !== id)
                        .map((component) => {
                            if (component.children) {
                                return {
                                    ...component,
                                    children: get().removeComponentFromTree(
                                        component.children,
                                        id
                                    ),
                                };
                            }
                            return component;
                        });
                },

                // Add component
                addComponent: (component, region = 'main', index) => {
                    const state = get();
                    state.pushHistory('Bileşen eklendi');

                    let newComponents: BuilderComponent[];

                    if (index !== undefined) {
                        newComponents = [...state.layoutData.components];
                        newComponents.splice(index, 0, component);
                    } else {
                        newComponents = [...state.layoutData.components, component];
                    }

                    set({
                        layoutData: {
                            ...state.layoutData,
                            components: newComponents,
                        },
                        selectedComponentId: component.id,
                        selectedRegion: region,
                        isDirty: true,
                    });
                },

                // Remove component
                removeComponent: (id) => {
                    const state = get();
                    state.pushHistory('Bileşen silindi');

                    const newComponents = get().removeComponentFromTree(
                        state.layoutData.components,
                        id
                    );

                    set({
                        layoutData: {
                            ...state.layoutData,
                            components: newComponents,
                        },
                        selectedComponentId: null,
                        isDirty: true,
                    });
                },

                // Update component props
                updateComponentProps: (id, props) => {
                    const state = get();
                    state.pushHistory('Bileşen güncellendi');

                    const newComponents = get().updateComponentInTree(
                        state.layoutData.components,
                        id,
                        (component) => ({
                            ...component,
                            props: { ...component.props, ...props },
                        })
                    );

                    set({
                        layoutData: {
                            ...state.layoutData,
                            components: newComponents,
                        },
                        isDirty: true,
                    });
                },

                // Move component
                moveComponent: (id, newIndex, newRegion) => {
                    const state = get();
                    state.pushHistory('Bileşen taşındı');

                    // Find and remove component
                    const component = get().findComponent(
                        state.layoutData.components,
                        id
                    );
                    if (!component) return;

                    const componentsWithoutMoved = get().removeComponentFromTree(
                        state.layoutData.components,
                        id
                    );

                    // Insert at new position with bounds validation
                    const newComponents = [...componentsWithoutMoved];
                    const clampedIndex = Math.max(0, Math.min(newIndex, newComponents.length));
                    newComponents.splice(clampedIndex, 0, component);

                    set({
                        layoutData: {
                            ...state.layoutData,
                            components: newComponents,
                        },
                        selectedRegion: newRegion || state.selectedRegion,
                        isDirty: true,
                    });
                },

                // Duplicate component
                duplicateComponent: (id) => {
                    const state = get();
                    const component = get().findComponent(
                        state.layoutData.components,
                        id
                    );
                    if (!component) return;

                    // SECURITY: Use crypto.randomUUID() instead of Date.now() to prevent ID collisions
                    // Deep clone with structuredClone to avoid shared children/props references
                    const duplicated: BuilderComponent = structuredClone(component);
                    duplicated.id = crypto.randomUUID();
                    duplicated.name = `${component.name} (Kopya)`;

                    const index = state.layoutData.components.findIndex(
                        (c) => c.id === id
                    );

                    state.addComponent(duplicated, state.selectedRegion, index + 1);
                },

                // Device preview
                setCurrentDevice: (device: DeviceType) => {
                    set({ currentDevice: device });
                },

                // Component device-specific props
                updateComponentVisibility: (id: string, visibility: DeviceVisibility) => {
                    const state = get();
                    state.pushHistory('Bileşen görünürlüğü güncellendi');

                    const newComponents = get().updateComponentInTree(
                        state.layoutData.components,
                        id,
                        (component) => ({
                            ...component,
                            visibility,
                        })
                    );

                    set({
                        layoutData: {
                            ...state.layoutData,
                            components: newComponents,
                        },
                        isDirty: true,
                    });
                },

                updateComponentDeviceProps: (id: string, device: DeviceType, props: Record<string, unknown>) => {
                    const state = get();
                    state.pushHistory('Cihaz özellikleri güncellendi');

                    const newComponents = get().updateComponentInTree(
                        state.layoutData.components,
                        id,
                        (component) => ({
                            ...component,
                            deviceProps: {
                                ...component.deviceProps,
                                [device]: props,
                            },
                        })
                    );

                    set({
                        layoutData: {
                            ...state.layoutData,
                            components: newComponents,
                        },
                        isDirty: true,
                    });
                },

                // History
                pushHistory: (description) => {
                    const state = get();
                    const newEntry: HistoryEntry = {
                        // Use structuredClone for proper deep copy (handles Date, undefined, etc.)
                        layoutData: structuredClone(state.layoutData),
                        timestamp: Date.now(),
                        description,
                    };

                    // Remove any redo history
                    const newHistory = state.history.slice(
                        0,
                        state.historyIndex + 1
                    );

                    newHistory.push(newEntry);

                    // Keep only last 50 entries
                    if (newHistory.length > 50) {
                        newHistory.shift();
                    }

                    set({
                        history: newHistory,
                        historyIndex: newHistory.length - 1,
                    });
                },

                undo: () => {
                    const state = get();
                    if (!state.canUndo()) return;

                    const newIndex = state.historyIndex - 1;
                    const entry = state.history[newIndex];

                    set({
                        historyIndex: newIndex,
                        layoutData: entry.layoutData,
                        isDirty: true,
                    });
                },

                redo: () => {
                    const state = get();
                    if (!state.canRedo()) return;

                    const newIndex = state.historyIndex + 1;
                    const entry = state.history[newIndex];

                    set({
                        historyIndex: newIndex,
                        layoutData: entry.layoutData,
                        isDirty: true,
                    });
                },

                canUndo: () => {
                    const state = get();
                    return state.historyIndex > 0;
                },

                canRedo: () => {
                    const state = get();
                    return state.historyIndex < state.history.length - 1;
                },

                // Loading states
                setLoading: (isLoading) => set({ isLoading }),
                setSaving: (isSaving) => set({ isSaving }),
                setDirty: (isDirty) => set({ isDirty }),

                // API operations
                saveLayout: async () => {
                    const state = get();
                    if (!state.pageInfo) return;

                    set({ isSaving: true });

                    try {
                        await api.put(`/builder/layouts/${state.pageInfo.id}`, {
                            layout_data: state.layoutData,
                        });

                        set({ isDirty: false, isSaving: false });
                    } catch (error) {
                        console.error('Failed to save layout:', error);
                        set({ isSaving: false });
                        throw error;
                    }
                },

                loadLayout: async (pageId) => {
                    set({ isLoading: true });

                    try {
                        const response = await api.get<{
                            page: PageInfo;
                            layout: { layout_data: LayoutData } | null;
                        }>(`/builder/layouts/${pageId}`);

                        if (response.layout?.layout_data) {
                            set({
                                pageInfo: response.page,
                                layoutData: response.layout.layout_data,
                                isDirty: false,
                                history: [],
                                historyIndex: -1,
                            });
                        } else {
                            set({
                                pageInfo: response.page,
                                layoutData: initialLayoutData,
                                isDirty: false,
                                history: [],
                                historyIndex: -1,
                            });
                        }
                    } catch (error) {
                        console.error('Failed to load layout:', error);
                        throw error;
                    } finally {
                        set({ isLoading: false });
                    }
                },

                publishLayout: async () => {
                    const state = get();
                    if (!state.pageInfo) return;

                    // Save first
                    await state.saveLayout();

                    // Then publish
                    await api.post(`/builder/layouts/${state.pageInfo.id}/publish`);
                },

                // Reset
                reset: () => {
                    set(initialState);
                },
            }),
            {
                name: 'builder-storage',
                partialize: (state) => ({
                    // Only persist non-sensitive data
                    layoutData: state.layoutData,
                }),
            }
        ),
        { name: 'BuilderStore' }
    )
);

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

    // Apply device-specific props
    if (deviceProps) {
        const deviceSpecificProps = deviceProps[currentDevice];
        if (deviceSpecificProps) {
            effectiveProps = { ...effectiveProps, ...deviceSpecificProps };
        }
    }

    // Apply live device overrides (from editing)
    if (deviceOverrides) {
        effectiveProps = { ...effectiveProps, ...deviceOverrides };
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
