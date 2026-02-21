'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { trackOnboardingEvent } from '@/lib/onboarding-analytics';

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

interface CreateOrganizationFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
}

export function CreateOrganizationForm({ onSuccess, onCancel, showCancel = false }: CreateOrganizationFormProps) {
    const router = useRouter();
    const auth = useAuth();
    const [orgName, setOrgName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = orgName.trim();
        if (!trimmedName || trimmedName.length < MIN_NAME_LENGTH) {
            toast.error(`Lütfen geçerli bir organizasyon adı girin (en az ${MIN_NAME_LENGTH} karakter)`);
            return;
        }

        if (trimmedName.length > MAX_NAME_LENGTH) {
            toast.error(`Organizasyon adı en fazla ${MAX_NAME_LENGTH} karakter olabilir`);
            return;
        }

        // Check if access token is available
        if (!auth.accessToken) {
            toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
            router.replace('/login');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/onboarding/tenant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.accessToken}`,
                },
                body: JSON.stringify({
                    name: trimmedName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create organization');
            }

            toast.success('Organizasyon başarıyla oluşturuldu!');

            // Track success
            trackOnboardingEvent('onboarding_organization_created', {
                step: 'organization_form',
                organizationName: trimmedName,
            });

            // Refresh user's auth data so that active tenant is updated globally
            await auth.refreshMe();

            // Call onSuccess callback
            if (onSuccess) {
                onSuccess();
            }

        } catch (error: unknown) {
            console.error('Onboarding error:', error);

            // Track failure
            trackOnboardingEvent('onboarding_organization_failed', {
                step: 'organization_form',
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            if (error instanceof Error) {
                toast.error(error.message || 'Bir hata oluştu');
            } else {
                toast.error('Bir hata oluştu');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="orgName" className="text-base">
                    Organizasyon Adı <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="orgName"
                    placeholder="Örn: Acme Inc."
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    autoFocus
                    className="h-12 text-base"
                    maxLength={MAX_NAME_LENGTH}
                    disabled={loading}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <p>Bu isim panellerde ve faturalarda görünecek.</p>
                    <p className={orgName.length > MAX_NAME_LENGTH * 0.9 ? 'text-warning' : ''}>
                        {orgName.length}/{MAX_NAME_LENGTH}
                    </p>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                {showCancel && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 h-12"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        İptal
                    </Button>
                )}
                <Button
                    type="submit"
                    className="flex-1 h-12 gradient-primary border-0 text-white"
                    disabled={loading || orgName.trim().length < MIN_NAME_LENGTH}
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Oluşturuluyor...
                        </>
                    ) : (
                        <>
                            Organizasyonu Oluştur
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
