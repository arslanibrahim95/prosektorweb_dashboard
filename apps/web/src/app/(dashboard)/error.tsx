'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            logger.error('Dashboard error', { error });
        }
    }, [error]);

    return (
        <div className="dashboard-main-content">
            <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-foreground">
                                    Bir şeyler yanlış gitti
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Bu sayfayı yüklerken bir hata oluştu.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error.digest && (
                            <p className="text-xs text-muted-foreground font-mono bg-muted rounded px-3 py-2">
                                Hata kodu: {error.digest}
                            </p>
                        )}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <Button
                                onClick={reset}
                                variant="outline"
                                className="border-destructive/20 text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                            >
                                Tekrar Dene
                            </Button>
                            <Button variant="outline" asChild className="w-full sm:w-auto">
                                <Link href="/home">Ana Sayfa</Link>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Sorun devam ederse lütfen sistem yöneticinize başvurun.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
