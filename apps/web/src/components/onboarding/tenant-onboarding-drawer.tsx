'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { CreateOrganizationForm } from '@/components/organization/create-organization-form';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';

export const OPEN_ONBOARDING_DRAWER_EVENT = 'prosektorweb:open-onboarding-drawer';

export function openTenantOnboardingDrawer() {
    window.dispatchEvent(new CustomEvent(OPEN_ONBOARDING_DRAWER_EVENT));
}

export function TenantOnboardingDrawer() {
    const [open, setOpen] = useState(false);
    const auth = useAuth();
    const router = useRouter();

    const handleOpen = useCallback(() => {
        setOpen(true);
    }, []);

    const handleClose = () => {
        setOpen(false);
    };

    const handleSuccess = useCallback(() => {
        // When successfully created, refresh the page to load new tenant context
        router.refresh();
        setOpen(false);
    }, [router]);

    useEffect(() => {
        // Listen for custom event to manually open the drawer
        window.addEventListener(OPEN_ONBOARDING_DRAWER_EVENT, handleOpen);
        return () => window.removeEventListener(OPEN_ONBOARDING_DRAWER_EVENT, handleOpen);
    }, [handleOpen]);

    // Optionally automatically open it if the user is fully logged in but has no tenant.
    useEffect(() => {
        if (auth.status === 'authenticated' && auth.me && !auth.me.tenant) {
            // Only open automatically if they haven't manually closed it this session,
            // or implement logic according to the requirement.
            // E.g. session storage can be used to not bug them repeatedly on every page load
            const hasDismissed = sessionStorage.getItem('tenant-onboarding-dismissed');
            if (!hasDismissed && !open) {
                // Add slight delay to prevent conflicting with Welcome Modal or initial mount
                const timer = setTimeout(() => {
                    setOpen(true);
                }, 1200);
                return () => clearTimeout(timer);
            }
        }
    }, [auth.status, auth.me, open]);

    return (
        <Sheet
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    sessionStorage.setItem('tenant-onboarding-dismissed', 'true');
                }
            }}
        >
            <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col pt-12">
                <SheetHeader className="px-0 pb-6 border-b border-border/50">
                    <SheetTitle className="text-2xl font-semibold tracking-tight">
                        Organizasyonunuzu Oluşturun
                    </SheetTitle>
                    <SheetDescription className="text-base text-muted-foreground mt-2 text-balance leading-relaxed">
                        Sistemin tüm özelliklerini (Dashboard, Raporlar, Ekip Üyeleri) kullanabilmek için lütfen bir organizasyon profili oluşturun. Bu adım kısa sürecek!
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto pt-8 pb-10">
                    <CreateOrganizationForm onSuccess={handleSuccess} onCancel={handleClose} showCancel />
                </div>
            </SheetContent>
        </Sheet>
    );
}
