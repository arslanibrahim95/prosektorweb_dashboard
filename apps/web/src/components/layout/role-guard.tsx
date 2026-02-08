'use client';

import { ReactNode } from 'react';
import { type UserRole, hasRole } from '@/server/auth';

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: UserRole[];
    userRole: UserRole;
    fallback?: ReactNode;
}

/**
 * RoleGuard - Permission gate component per agents.md spec
 * 
 * Usage:
 * <RoleGuard allowedRoles={['owner', 'admin']} userRole={currentRole}>
 *   <BillingSettings />
 * </RoleGuard>
 */
export function RoleGuard({
    children,
    allowedRoles,
    userRole,
    fallback = null
}: RoleGuardProps) {
    if (!hasRole(userRole, allowedRoles)) {
        return fallback;
    }

    return <>{children}</>;
}

/**
 * UnauthorizedScreen - 403 fallback component
 */
export function UnauthorizedScreen() {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center px-4">
            <div className="rounded-full bg-red-100 p-6 mb-6">
                <svg
                    className="w-12 h-12 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Erişim Engellendi
            </h2>
            <p className="text-gray-600 max-w-md">
                Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
                Yetkili bir kullanıcıyla iletişime geçin.
            </p>
        </div>
    );
}
