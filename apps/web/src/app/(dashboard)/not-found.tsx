import { FileQuestion } from 'lucide-react';
import { EmptyState } from '@/components/layout/states';

export default function DashboardNotFound() {
    return (
        <div className="dashboard-main-content">
            <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
                <EmptyState
                    icon={<FileQuestion className="h-8 w-8" />}
                    title="Sayfa Bulunamadı"
                    description="Aradığınız sayfa mevcut değil."
                    action={{
                        label: "Ana Sayfa'ya Dön",
                        href: '/home',
                    }}
                />
            </div>
        </div>
    );
}
