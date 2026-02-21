import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Shield, Clock, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiteHealthProps {
    currentSiteStatus?: string;
    primaryDomainStatus?: { ssl_status: string } | null;
    activeJobPostsCount: number;
    isLoading: boolean;
    onRefetch?: () => void;
    dataUpdatedAt?: number;
}

function formatLastUpdated(updatedAt: number, currentTime: number): string {
    const diffMs = currentTime - updatedAt;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'az önce';
    if (diffMins === 1) return '1 dk önce';
    return `${diffMins} dk önce`;
}

export function SiteHealthCard({
    currentSiteStatus,
    primaryDomainStatus,
    activeJobPostsCount,
    isLoading,
    onRefetch,
    dataUpdatedAt,
}: SiteHealthProps) {
    const [now, setNow] = useState(() => Date.now());
    const lastUpdatedLabel = dataUpdatedAt ? formatLastUpdated(dataUpdatedAt, now) : '';

    useEffect(() => {
        if (!dataUpdatedAt) return undefined;
        const interval = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(interval);
    }, [dataUpdatedAt]);

    const sslStatus = primaryDomainStatus?.ssl_status;
    const isSslError = sslStatus && !['active', 'valid', 'pending'].includes(sslStatus.toLowerCase());
    const isSiteError = currentSiteStatus === 'error' || currentSiteStatus === 'offline';
    const isCritical = isSslError || isSiteError;
    const isWarning = sslStatus === 'pending' || currentSiteStatus === 'staging';

    return (
        <div className="space-y-2">
            {isCritical && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
                    <XCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                    <p className="font-medium text-destructive">
                        {isSiteError && `Site durumu: ${currentSiteStatus}. `}
                        {isSslError && `SSL sertifikası hatası: ${sslStatus}. `}
                        Hemen kontrol edin.
                    </p>
                </div>
            )}
            {!isCritical && isWarning && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">
                        {sslStatus === 'pending' && 'SSL sertifikası doğrulanıyor. '}
                        {currentSiteStatus === 'staging' && 'Site staging ortamında yayında. '}
                        Production yayınına geçmeyi unutmayın.
                    </p>
                </div>
            )}

            <Card className="glass border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <div className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center',
                            isCritical ? 'bg-destructive/10' : 'bg-primary/10'
                        )}>
                            <Globe className={cn('h-4 w-4', isCritical ? 'text-destructive' : 'text-primary')} />
                        </div>
                        Site Durumu
                    </CardTitle>
                    <CardDescription>Alan adı, SSL ve ilan durumunu takip edin</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3 items-center">
                        <Badge variant="outline" className={cn('py-1', isSiteError && 'border-destructive/50 text-destructive')}>
                            <Globe className="h-3 w-3 mr-1.5" />
                            {currentSiteStatus ?? '—'}
                        </Badge>
                        <Badge variant="outline" className={cn('py-1', isSslError && 'border-destructive/50 text-destructive')}>
                            <Shield className="h-3 w-3 mr-1.5" />
                            {primaryDomainStatus ? `SSL: ${primaryDomainStatus.ssl_status}` : 'SSL: —'}
                        </Badge>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-sm">Aktif ilanlar: {activeJobPostsCount}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between">
                    {lastUpdatedLabel && (
                        <span className="text-xs text-muted-foreground">
                            Son yenilenme: {lastUpdatedLabel}
                        </span>
                    )}
                    {onRefetch && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-7 text-xs gap-1.5"
                            onClick={onRefetch}
                            disabled={isLoading}
                        >
                            <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
                            Senkronize Et
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
