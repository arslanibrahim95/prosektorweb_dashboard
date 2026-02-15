/**
 * ComponentPalette - Bileşen Seçim Paneli
 * 
 * Sol tarafta bulunan ve kullanıcının canvas'a sürükleyebileceği 
 * bileşenlerin listelendiği panel
 */

'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { componentRegistry, getCategories } from '../components-library/registry';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// ============================================================================
// Icons Map
// ============================================================================

const Icons: Record<string, React.ReactNode> = {
    LayoutTemplate: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
    ),
    Type: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
    ),
    Image: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Images: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    MousePointerClick: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
    ),
    FileInput: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    Square: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        </svg>
    ),
    LayoutGrid: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    MoveVertical: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
    ),
    Navigation: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    Footer: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
    ),
};

function getIcon(iconName: string): React.ReactNode {
    return Icons[iconName] || Icons.Square;
}

// ============================================================================
// Draggable Component Item
// ============================================================================

interface DraggableComponentProps {
    config: typeof componentRegistry[string];
}

function DraggableComponent({ config }: DraggableComponentProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${config.type}`,
        data: {
            type: config.type,
            component: config,
        },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                'flex items-center gap-3 p-3 rounded-md cursor-grab active:cursor-grabbing',
                'bg-background hover:bg-muted border border-border transition-colors',
                'hover:border-primary/50 hover:shadow-sm',
                isDragging && 'opacity-50'
            )}
        >
            <div className="flex-shrink-0 text-muted-foreground">
                {getIcon(config.icon)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{config.name}</p>
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function ComponentPalette() {
    const categories = getCategories();

    return (
        <div className="w-64 bg-background border-r flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b">
                <h2 className="font-semibold">Bileşenler</h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Sürükleyerek ekleyin
                </p>
            </div>

            {/* Components List */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {categories.map((category) => {
                        const categoryComponents = Object.values(componentRegistry).filter(
                            (c) => c.category === category.id
                        );

                        if (categoryComponents.length === 0) return null;

                        return (
                            <div key={category.id}>
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                    {category.name}
                                </h3>
                                <div className="space-y-1">
                                    {categoryComponents.map((config) => (
                                        <DraggableComponent
                                            key={config.type}
                                            config={config}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}

export default ComponentPalette;
