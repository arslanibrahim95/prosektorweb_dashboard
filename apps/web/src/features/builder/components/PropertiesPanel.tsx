/**
 * PropertiesPanel - Özellikler Paneli
 * 
 * Seçili bileşenin özelliklerini düzenlemek için sağ tarafta bulunan panel
 */

'use client';

import React, { useCallback } from 'react';
import { useBuilderStore, useSelectedComponent, DeviceType } from '@/hooks/use-builder';
import { componentRegistry, type ComponentConfig } from '../components-library/registry';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { PropertyField } from './property-fields';

// ============================================================================
// Main Panel Component
// ============================================================================

export function PropertiesPanel() {
    const selectedComponent = useSelectedComponent();
    const {
        updateComponentProps,
        removeComponent,
        duplicateComponent,
        currentDevice,
        setCurrentDevice,
        updateComponentVisibility,
    } = useBuilderStore();

    const handleChange = useCallback((key: string, value: unknown) => {
        if (selectedComponent) {
            updateComponentProps(selectedComponent.id, { [key]: value });
        }
    }, [selectedComponent, updateComponentProps]);

    const handleDelete = useCallback(() => {
        if (selectedComponent) {
            removeComponent(selectedComponent.id);
        }
    }, [selectedComponent, removeComponent]);

    const handleDuplicate = useCallback(() => {
        if (selectedComponent) {
            duplicateComponent(selectedComponent.id);
        }
    }, [selectedComponent, duplicateComponent]);

    // Handle visibility toggle for a specific device
    const handleVisibilityToggle = useCallback((device: DeviceType, visible: boolean) => {
        if (selectedComponent) {
            const newVisibility = {
                ...selectedComponent.visibility,
                [device]: visible,
            };
            updateComponentVisibility(selectedComponent.id, newVisibility);
        }
    }, [selectedComponent, updateComponentVisibility]);

    if (!selectedComponent) {
        return (
            <div className="w-80 bg-background border-l flex flex-col h-full">
                <div className="p-4 border-b">
                    <h2 className="font-semibold">Özellikler</h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center text-muted-foreground">
                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        <p className="text-sm">Düzenlemek için bir bileşen seçin</p>
                    </div>
                </div>
            </div>
        );
    }

    const config = componentRegistry[selectedComponent.type];
    const schema = config?.schema || {};
    const schemaEntries = Object.entries(schema) as Array<[string, ComponentConfig['schema'][string]]>;

    return (
        <div className="w-80 bg-background border-l flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b">
                <h2 className="font-semibold">{config?.name || selectedComponent.type}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                    Bileşen özelliklerini düzenleyin
                </p>
            </div>

            {/* Properties */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Content Section */}
                    {schemaEntries.filter(([, fieldConfig]) =>
                        ['text', 'textarea', 'image', 'url'].includes(fieldConfig.type)
                    ).length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    İçerik
                                </h3>
                                {schemaEntries
                                    .filter(([, fieldConfig]) =>
                                        ['text', 'textarea', 'image', 'url'].includes(fieldConfig.type)
                                    )
                                    .map(([key, fieldConfig]) => (
                                        <div key={key} className="space-y-2">
                                            <Label>{fieldConfig.label}</Label>
                                            <PropertyField
                                                value={selectedComponent.props[key]}
                                                onChange={(value) => handleChange(key, value)}
                                                config={fieldConfig}
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}

                    {/* Layout Section */}
                    {schemaEntries.filter(([, fieldConfig]) =>
                        ['select', 'number', 'range'].includes(fieldConfig.type)
                    ).length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Düzen
                                    </h3>
                                    {schemaEntries
                                        .filter(([, fieldConfig]) =>
                                            ['select', 'number', 'range'].includes(fieldConfig.type)
                                        )
                                        .map(([key, fieldConfig]) => (
                                            <div key={key} className="space-y-2">
                                                <Label>{fieldConfig.label}</Label>
                                                <PropertyField
                                                    value={selectedComponent.props[key]}
                                                    onChange={(value) => handleChange(key, value)}
                                                    config={fieldConfig}
                                                />
                                            </div>
                                        ))}
                                </div>
                            </>
                        )}

                    {/* Style Section */}
                    {schemaEntries.filter(([, fieldConfig]) =>
                        fieldConfig.type === 'color'
                    ).length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Stil
                                    </h3>
                                    {schemaEntries
                                        .filter(([, fieldConfig]) => fieldConfig.type === 'color')
                                        .map(([key, fieldConfig]) => (
                                            <div key={key} className="space-y-2">
                                                <Label>{fieldConfig.label}</Label>
                                                <PropertyField
                                                    value={selectedComponent.props[key]}
                                                    onChange={(value) => handleChange(key, value)}
                                                    config={fieldConfig}
                                                />
                                            </div>
                                        ))}
                                </div>
                            </>
                        )}

                    {/* Boolean Section */}
                    {schemaEntries.filter(([, fieldConfig]) =>
                        fieldConfig.type === 'boolean'
                    ).length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Ayarlar
                                    </h3>
                                    {schemaEntries
                                        .filter(([, fieldConfig]) => fieldConfig.type === 'boolean')
                                        .map(([key, fieldConfig]) => (
                                            <div key={key} className="flex items-center justify-between">
                                                <Label>{fieldConfig.label}</Label>
                                                <PropertyField
                                                    value={selectedComponent.props[key]}
                                                    onChange={(value) => handleChange(key, value)}
                                                    config={fieldConfig}
                                                />
                                            </div>
                                        ))}
                                </div>
                            </>
                        )}

                    {/* Device Visibility Section */}
                    <Separator />
                    <div className="space-y-4">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Cihaz Görünürlüğü
                        </h3>

                        {/* Device Selector */}
                        <div className="flex gap-1 p-1 bg-muted rounded-lg">
                            {(['desktop', 'tablet', 'mobile'] as DeviceType[]).map((device) => (
                                <button
                                    key={device}
                                    onClick={() => setCurrentDevice(device)}
                                    className={cn(
                                        'flex-1 py-1.5 px-2 text-xs rounded-md transition-colors',
                                        currentDevice === device
                                            ? 'bg-background shadow-sm font-medium'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {device === 'desktop' && 'Masaüstü'}
                                    {device === 'tablet' && 'Tablet'}
                                    {device === 'mobile' && 'Mobil'}
                                </button>
                            ))}
                        </div>

                        {/* Visibility Toggles */}
                        <div className="space-y-3">
                            {(['desktop', 'tablet', 'mobile'] as DeviceType[]).map((device) => {
                                const isVisible = selectedComponent.visibility?.[device] !== false;
                                const deviceLabel = device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Mobile';
                                return (
                                    <div key={device} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {device === 'desktop' && <span className="text-lg">🖥️</span>}
                                            {device === 'tablet' && <span className="text-lg">📱</span>}
                                            {device === 'mobile' && <span className="text-lg">📱</span>}
                                            <Label>{deviceLabel}</Label>
                                        </div>
                                        <Switch
                                            checked={isVisible}
                                            onCheckedChange={(checked) => handleVisibilityToggle(device, checked)}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Bileşenin hangi cihazlarda görüneceğini ayarlayın.
                        </p>
                    </div>
                </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-4 border-t space-y-2">
                <Button variant="outline" className="w-full" onClick={handleDuplicate}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Kopyala
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleDelete}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Sil
                </Button>
            </div>
        </div>
    );
}

export default PropertiesPanel;
