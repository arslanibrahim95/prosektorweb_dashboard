/**
 * BuilderCanvas - Ana çalışma alanı
 * 
 * Drag & drop ile bileşenlerin sürüklendiği ve düzenlendiği ana alan
 */

'use client';

import React, { useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore, BuilderComponent, isComponentVisible } from '@/hooks/use-builder';
import { componentRegistry } from '../components-library/registry';
import { cn } from '@/lib/utils';
import { DevicePreviewToolbar, type DeviceType } from './DevicePreviewToolbar';

// Device widths - defined outside component to prevent recreation
const DEVICE_WIDTHS: Record<DeviceType, number> = {
    desktop: 1280,
    tablet: 768,
    mobile: 375,
};

// ============================================================================
// Sortable Item Component
// ============================================================================

interface SortableItemProps {
    component: BuilderComponent;
    isSelected: boolean;
    onSelect: (id: string | null, region?: string) => void;
    onRemove: (id: string) => void;
    currentDevice: DeviceType;
}

function SortableComponent({ component, isSelected, onSelect, onRemove, currentDevice }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: component.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const config = componentRegistry[component.type];
    const PreviewComponent = config?.component;

    // Check visibility for current device
    const isVisible = isComponentVisible(component.visibility, currentDevice);

    // Don't render if not visible
    if (!isVisible) {
        return null;
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative group cursor-pointer transition-all',
                isDragging && 'opacity-50 z-50',
                isSelected && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(component.id);
            }}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'cursor-grab active:cursor-grabbing'
                )}
            >
                <div className="bg-primary text-white p-1 rounded-l-md">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </div>
            </div>

            {/* Component Preview */}
            <div className="border-2 border-transparent group-hover:border-primary/50 transition-colors rounded-md overflow-hidden">
                {PreviewComponent ? (
                    <PreviewComponent {...component.props} />
                ) : (
                    <div className="p-4 bg-muted text-muted-foreground">
                        Bilinmeyen bileşen: {component.type}
                    </div>
                )}
            </div>

            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(component.id);
                }}
                className={cn(
                    'absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity',
                    'bg-destructive text-destructive-foreground p-1 rounded-md hover:bg-destructive/90'
                )}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Component Label */}
            <div className={cn(
                'absolute left-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity',
                'bg-background/90 text-xs px-2 py-1 rounded-md'
            )}>
                {component.name || component.type}
            </div>
        </div>
    );
}

// ============================================================================
// Drop Zone
// ============================================================================

interface DropZoneProps {
    isOver: boolean;
    isEmpty: boolean;
}

function DropZone({ isOver, isEmpty }: DropZoneProps) {
    if (!isEmpty) return null;

    return (
        <div
            className={cn(
                'border-2 border-dashed rounded-lg transition-colors min-h-[200px]',
                'flex items-center justify-center',
                isOver
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground/30 hover:border-muted-foreground/50'
            )}
        >
            <div className="text-center text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm">Bileşen eklemek için buraya sürükleyin</p>
            </div>
        </div>
    );
}

// ============================================================================
// Main Canvas Component
// ============================================================================

interface BuilderCanvasProps {
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

export function BuilderCanvas({ onDragStart, onDragEnd }: BuilderCanvasProps) {
    const {
        layoutData,
        selectedComponentId,
        setSelectedComponent,
        addComponent,
        removeComponent,
        updateComponents,
        currentDevice,
        setCurrentDevice,
    } = useBuilderStore();

    const components = layoutData.components;
    const isEmpty = components.length === 0;

    // Use constant device widths

    // DnD Sensors - hooks must be called at top level, not inside useMemo
    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    });
    const keyboardSensor = useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    });
    const sensors = useSensors(pointerSensor, keyboardSensor);

    // Handle drag start
    const handleDragStart = useCallback(() => {
        onDragStart?.();
    }, [onDragStart]);

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        onDragEnd?.();

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Handle dropping new component from palette
        if (activeId.startsWith('palette-')) {
            const componentType = activeId.replace('palette-', '');
            const config = componentRegistry[componentType];

            if (config) {
                // Add new component
                addComponent({
                    id: `${componentType}-${Date.now()}`,
                    type: componentType,
                    name: config.name,
                    props: { ...config.defaultProps },
                });
            }
            return;
        }

        // Handle reordering existing components
        if (activeId !== overId) {
            const oldIndex = components.findIndex((c) => c.id === activeId);
            const newIndex = components.findIndex((c) => c.id === overId);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newComponents = arrayMove(components, oldIndex, newIndex);
                updateComponents(newComponents);
            }
        }
    }, [components, addComponent, updateComponents, onDragEnd]);

    // Handle canvas click (deselect)
    const handleCanvasClick = useCallback(() => {
        setSelectedComponent(null);
    }, [setSelectedComponent]);

    return (
        <div
            className="flex-1 bg-gray-100 overflow-auto"
            onClick={handleCanvasClick}
        >
            {/* Device Preview Toolbar */}
            <div className="sticky top-0 z-10 bg-background border-b px-4 py-2">
                <DevicePreviewToolbar
                    currentDevice={currentDevice}
                    onDeviceChange={setCurrentDevice}
                />
            </div>

            {/* Canvas Area */}
            <div className="p-8">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div
                        className="mx-auto bg-white rounded-lg shadow-sm min-h-[600px] transition-all duration-300"
                        style={{ width: DEVICE_WIDTHS[currentDevice], maxWidth: '100%' }}
                    >
                        {isEmpty ? (
                            <DropZone isOver={false} isEmpty={isEmpty} />
                        ) : (
                            <SortableContext
                                items={components.map((c) => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="p-4 space-y-2">
                                    {components.map((component) => (
                                        <SortableComponent
                                            key={component.id}
                                            component={component}
                                            isSelected={selectedComponentId === component.id}
                                            onSelect={setSelectedComponent}
                                            onRemove={removeComponent}
                                            currentDevice={currentDevice}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        )}
                    </div>

                    {/* Drag Overlay for new components */}
                    <DragOverlay>
                        {/* This would show a preview of the component being dragged */}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}

export default BuilderCanvas;
