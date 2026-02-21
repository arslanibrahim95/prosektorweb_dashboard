import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

export type ActivityItem = {
    id: string;
    type: 'offer' | 'contact' | 'application';
    name: string;
    time: string;
    detail: string;
    color: string;
    created_at: string;
};

interface RecentActivityProps {
    activities: ActivityItem[];
    isLoading?: boolean;
}

export function RecentActivity({ activities, isLoading = false }: RecentActivityProps) {
    return (
        <Card className="glass border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">Son Aktiviteler</CardTitle>
                <CardDescription>Son gelen başvurular ve mesajlar</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-3 w-12 shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <EmptyState
                        icon={<Inbox className="h-10 w-10" />}
                        title="Henüz aktivite yok"
                        description="Teklif talepleri, mesajlar ve başvurular burada görüntülenecek"
                        action={{
                            label: "Inbox'u Aç",
                            href: "/inbox/offers",
                        }}
                    />
                ) : (
                    <div className="space-y-1 stagger-children relative">
                        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border/50" />
                        {activities.map((item) => (
                            <Link
                                key={item.id}
                                href={`/inbox/${item.type === 'offer' ? 'offers' : item.type === 'contact' ? 'contact' : 'applications'}`}
                                className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors duration-200 group relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div
                                        className={cn(
                                            'h-9 w-9 rounded-full flex items-center justify-center text-success-foreground text-xs font-bold shadow-sm relative z-10 shrink-0',
                                            item.color,
                                        )}
                                        aria-hidden="true"
                                    >
                                        {item.name.split(' ').map((n) => n[0]).join('')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.time}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
            {!isLoading && activities.length > 0 && (
                <CardFooter className="pt-0">
                    <Button variant="ghost" className="w-full text-primary hover:text-primary" asChild>
                        <Link href="/inbox/offers">
                            Tümünü Gör
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
