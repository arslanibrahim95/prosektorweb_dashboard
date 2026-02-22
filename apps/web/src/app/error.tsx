'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            logger.error('Global error', { error });
        }
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md text-center animate-in fade-in duration-300">
                {/* Icon */}
                <div className="mx-auto h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                    Bir hata oluştu
                </h1>

                {/* Description */}
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                    Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
                </p>

                {error.digest && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted rounded px-3 py-2 mb-6 mx-auto max-w-xs">
                        Hata kodu: {error.digest}
                    </p>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                    <Button
                        onClick={reset}
                        className="gradient-primary border-0 text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 w-full sm:w-auto"
                    >
                        Tekrar Dene
                    </Button>
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/home">Ana Sayfa</Link>
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Sorun devam ederse lütfen sistem yöneticinize başvurun.
                </p>
            </div>
        </div>
    );
}
