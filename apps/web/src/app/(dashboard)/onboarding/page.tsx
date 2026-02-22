"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * DEPRECATED: Bu sayfa artık kullanılmıyor.
 * Yeni onboarding akışı için /onboarding/welcome kullanılıyor.
 * 
 * Bu sayfa sadece eski URL'lere gelen kullanıcıları yeni akışa yönlendirmek için tutuluyor.
 */
export default function OnboardingPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to new onboarding flow
        router.replace('/onboarding/welcome');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Yönlendiriliyor...</p>
            </div>
        </div>
    );
}
