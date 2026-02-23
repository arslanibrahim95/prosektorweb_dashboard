import React from 'react';
import Link from 'next/link';
import { Wand2, Link2, Send, Inbox, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
    { label: 'Vibe Üretim', icon: Wand2, href: '/site/generate', gradient: 'gradient-primary' },
    { label: 'Domain Ekle', icon: Link2, href: '/site/domains', gradient: 'gradient-info' },
    { label: 'Teklif Modülü', icon: Send, href: '/modules/offer', gradient: 'gradient-success' },
    { label: 'Mesajları Gör', icon: Inbox, href: '/inbox/offers', gradient: 'gradient-accent' },
    { label: 'İlan Oluştur', icon: Briefcase, href: '/modules/hr/job-posts', gradient: 'gradient-warning' },
];

export function QuickActions() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 stagger-children">
            {actions.map((action) => (
                <Link
                    key={action.href}
                    href={action.href}
                    className="group flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 rounded-xl border border-border/50 bg-card p-3 hover:shadow-md hover:-translate-y-0.5 hover:bg-accent/5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110', action.gradient)}>
                        <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-center sm:text-left leading-tight line-clamp-2">{action.label}</span>
                </Link>
            ))}
        </div>
    );
}
