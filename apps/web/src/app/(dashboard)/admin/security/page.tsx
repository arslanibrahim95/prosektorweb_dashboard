'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ShieldCheck, Ban } from 'lucide-react';
import { SessionsPanel } from '@/features/admin/components/sessions-panel';
import { TwoFASettingsPanel } from '@/features/admin/components/twofa-settings-panel';
import { IpBlocksPanel } from '@/features/admin/components/ip-blocks-panel';

export default function SecurityPage() {
    const [activeTab, setActiveTab] = useState('sessions');

    return (
        <div className="dashboard-page page-enter">
            <AdminPageHeader
                title="Güvenlik"
                description="Aktif oturumları inceleyin, şüpheli erişimleri sonlandırın ve güvenlik kurallarını yönetin."
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass border-border/50">
                    <TabsTrigger value="sessions">
                        <Users className="mr-2 h-4 w-4" />
                        Oturum Yönetimi
                    </TabsTrigger>
                    <TabsTrigger value="2fa">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        İki Faktörlü Doğrulama
                    </TabsTrigger>
                    <TabsTrigger value="ip-blocking">
                        <Ban className="mr-2 h-4 w-4" />
                        IP Engelleme
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sessions">
                    <SessionsPanel />
                </TabsContent>

                <TabsContent value="2fa">
                    <TwoFASettingsPanel />
                </TabsContent>

                <TabsContent value="ip-blocking">
                    <IpBlocksPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}
