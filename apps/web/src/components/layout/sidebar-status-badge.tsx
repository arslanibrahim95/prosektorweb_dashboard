import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import { useSite } from '@/components/site/site-provider';

const STATUS_CONFIG = {
    published: { dot: 'bg-emerald-400', text: 'Canlı' },
    staging: { dot: 'bg-amber-400', text: 'Staging' },
    draft: { dot: 'bg-white/30', text: 'Taslak' },
} as const;

interface SiteStatusBadgeProps {
    collapsed: boolean;
}

const SiteStatusBadgeContent = ({ collapsed }: SiteStatusBadgeProps) => {
    const site = useSite();
    const currentSite = site.sites.find(s => s.id === site.currentSiteId);

    if (!currentSite || collapsed) return null;

    const status = STATUS_CONFIG[currentSite.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;

    return (
        <div className="mx-3 mb-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Globe className="h-3 w-3 text-white/30 shrink-0" />
            <span className="text-[12px] text-white/60 truncate flex-1 min-w-0">
                {currentSite.name}
            </span>
            <span className="flex items-center gap-1 shrink-0">
                <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                <span className="text-[10px] text-white/40 font-medium">{status.text}</span>
            </span>
        </div>
    );
};

export const SiteStatusBadge = memo(function SiteStatusBadge({ collapsed }: SiteStatusBadgeProps) {
    return <SiteStatusBadgeContent collapsed={collapsed} />;
});

export { STATUS_CONFIG };
