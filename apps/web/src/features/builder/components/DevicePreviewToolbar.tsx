/**
 * DevicePreviewToolbar - Cihaz Önizleme Araç Çubuğu
 * 
 * Farklı ekran boyutlarında önizleme yapmak için toolbar
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface DevicePreviewToolbarProps {
    currentDevice: DeviceType;
    onDeviceChange: (device: DeviceType) => void;
    className?: string;
}

const devices: { id: DeviceType; label: string; width: number; icon: React.ReactNode }[] = [
    {
        id: 'desktop',
        label: 'Masaüstü',
        width: 1280,
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: 'tablet',
        label: 'Tablet',
        width: 768,
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: 'mobile',
        label: 'Mobil',
        width: 375,
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
    },
];

export function DevicePreviewToolbar({
    currentDevice,
    onDeviceChange,
    className,
}: DevicePreviewToolbarProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-1 p-1 bg-muted rounded-lg',
                className
            )}
        >
            {devices.map((device) => (
                <Button
                    key={device.id}
                    variant={currentDevice === device.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onDeviceChange(device.id)}
                    className={cn(
                        'gap-2',
                        currentDevice === device.id && 'bg-primary text-primary-foreground'
                    )}
                    title={device.label}
                >
                    {device.icon}
                    <span className="hidden md:inline">{device.label}</span>
                </Button>
            ))}

            {/* Current width indicator */}
            <div className="ml-2 px-2 py-1 text-xs text-muted-foreground border-l">
                {devices.find(d => d.id === currentDevice)?.width}px
            </div>
        </div>
    );
}

export default DevicePreviewToolbar;
