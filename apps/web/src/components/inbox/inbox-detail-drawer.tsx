'use client';

import * as React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

export interface InboxDetailDrawerProps<T> {
    /** Selected item */
    item: T | null;
    /** Close handler */
    onClose: () => void;
    /** Render title */
    renderTitle: (item: T) => React.ReactNode;
    /** Render description */
    renderDescription: (item: T) => React.ReactNode;
    /** Render content */
    renderContent: (item: T) => React.ReactNode;
    /** Custom sheet content className */
    className?: string;
}

export function InboxDetailDrawer<T>({
    item,
    onClose,
    renderTitle,
    renderDescription,
    renderContent,
    className,
}: InboxDetailDrawerProps<T>) {
    return (
        <Sheet open={!!item} onOpenChange={onClose}>
            <SheetContent className={className}>
                {item && (
                    <>
                        <SheetHeader>
                            <SheetTitle>{renderTitle(item)}</SheetTitle>
                            <SheetDescription>{renderDescription(item)}</SheetDescription>
                        </SheetHeader>
                        {renderContent(item)}
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
