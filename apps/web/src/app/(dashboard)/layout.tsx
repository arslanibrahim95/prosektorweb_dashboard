import { AppShell } from '@/components/layout';
import { ReactNode } from 'react';

// Mock user data (will be replaced with real auth)
const mockUser = {
    name: 'Ahmet Yılmaz',
    email: 'ahmet@prosektor.com',
};

const mockTenant = {
    name: 'Demo OSGB',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <AppShell user={mockUser} tenant={mockTenant}>
            {children}
        </AppShell>
    );
}
