'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Onboarding error:', error);
    }, [error]);

    return (
        <div className="max-w-xl mx-auto">
            <Card className="glass border-border/50 shadow-xl">
                <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10 text-destructive mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl">Bir Hata Oluştu</CardTitle>
                    <CardDescription className="text-base">
                        Onboarding sürecinde bir sorun yaşandı. Lütfen tekrar deneyin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error.message && (
                        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                            <p className="text-sm text-destructive font-mono">{error.message}</p>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <Button
                            onClick={reset}
                            className="flex-1 h-12"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Tekrar Dene
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-12"
                            onClick={() => { window.location.href = '/login'; }}
                        >
                            Giriş Sayfasına Dön
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
