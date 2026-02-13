import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md text-center animate-in fade-in duration-300">
                {/* Glassmorphism card */}
                <div className="glass-strong rounded-3xl p-8 shadow-2xl">
                    {/* 404 with gradient */}
                    <div className="mb-6">
                        <h1 className="text-8xl font-bold bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                            404
                        </h1>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-semibold text-foreground mb-2">
                        Sayfa Bulunamadı
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground mb-8">Aradığınız sayfayı bulamadık. Silinmiş veya taşınmış olabilir.</p>

                    {/* Action */}
                    <Button
                        asChild
                        className="gradient-primary border-0 text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 w-full sm:w-auto"
                    >
                        <Link href="/home">Ana Sayfa&#39;ya Dön</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
