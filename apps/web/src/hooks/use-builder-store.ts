import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { produce } from 'immer';
import { api } from '@/server/api';
import { logger } from '@/lib/logger';
import {
    type BuilderState,
    type LayoutData,
    type DeviceType,
    type HistoryEntry,
    type BuilderComponent,
    type DeviceVisibility,
} from './use-builder-types';

export const initialLayoutData: LayoutData = {
    components: [],
    settings: {},
    breakpoints: {},
};

const initialState = {
    pageInfo: null,
    layoutData: initialLayoutData,
    selectedComponentId: null,
    selectedRegion: 'main',
    currentDevice: 'desktop' as DeviceType,
    history: [{ layoutData: initialLayoutData, timestamp: Date.now(), description: 'Başlangıç' }],
    historyIndex: 0,
    isLoading: false,
    isSaving: false,
    isDirty: false,
};

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

                addComponent: (component, region = 'main', index) => {
                    const state = get();

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
                    get().pushHistory('Bileşen eklendi');
                },

                removeComponent: (id) => {
                    const state = get();

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
                    get().pushHistory('Bileşen silindi');
                },

                updateComponentProps: (id, props) => {
                    const state = get();

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
                    get().pushHistory('Bileşen güncellendi');
                },

                moveComponent: (id, newIndex, newRegion) => {
                    const state = get();

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
                    get().pushHistory('Bileşen taşındı');
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
                    const duplicated = produce(component, draft => {
                        draft.id = crypto.randomUUID();
                        draft.name = `${component.name} (Kopya)`;
                    });

                    const index = state.layoutData.components.findIndex(
                        (c) => c.id === id
                    );

                    state.addComponent(duplicated, state.selectedRegion, index + 1);
                },

                // Device preview
                setCurrentDevice: (device: DeviceType) => {
                    set({ currentDevice: device });
                },

                updateComponentVisibility: (id: string, visibility: DeviceVisibility) => {
                    const state = get();

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
                    get().pushHistory('Bileşen görünürlüğü güncellendi');
                },

                updateComponentDeviceProps: (id: string, device: DeviceType, props: Record<string, unknown>) => {
                    const state = get();

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
                    get().pushHistory('Cihaz özellikleri güncellendi');
                },

                // History
                pushHistory: (description) => {
                    const state = get();

                    // Optimization: We rely on structural sharing (shallow copies) in our state updates.
                    // Since layoutData is treated immutably across the app, we can just store the reference
                    // directly. This effectively acts as a persistent data structure (delta storage), 
                    // preventing explosive memory growth without needing deep cloning.
                    const newEntry: HistoryEntry = {
                        layoutData: state.layoutData,
                        timestamp: Date.now(),
                        description,
                    };

                    // Remove any redo history
                    const newHistory = state.history.slice(
                        0,
                        state.historyIndex + 1
                    );

                    newHistory.push(newEntry);

                    // Reduced history limit to prevent memory bloat over long sessions
                    // Changed from 30 to 15 for better memory management
                    if (newHistory.length > 15) {
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
                    if (!entry) return;

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
                    if (!entry) return;

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
                        logger.error('Failed to save layout', { error });
                        set({ isSaving: false });
                        throw error;
                    }
                },

                loadLayout: async (pageId) => {
                    set({ isLoading: true });

                    try {
                        const response = await api.get<{
                            page: typeof initialState.pageInfo;
                            layout: { layout_data: LayoutData } | null;
                        }>(`/builder/layouts/${pageId}`);

                        if (response.layout?.layout_data) {
                            set({
                                pageInfo: response.page,
                                layoutData: response.layout.layout_data,
                                isDirty: false,
                                history: [{ layoutData: response.layout.layout_data, timestamp: Date.now(), description: 'Yüklendi' }],
                                historyIndex: 0,
                            });
                        } else {
                            set({
                                pageInfo: response.page,
                                layoutData: initialLayoutData,
                                isDirty: false,
                                history: [{ layoutData: initialLayoutData, timestamp: Date.now(), description: 'Başlangıç' }],
                                historyIndex: 0,
                            });
                        }
                    } catch (error) {
                        logger.error('Failed to load layout', { error });
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
