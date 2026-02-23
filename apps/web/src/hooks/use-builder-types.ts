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
