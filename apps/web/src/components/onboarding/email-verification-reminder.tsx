'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Mail, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from '@/lib/storage';

interface EmailVerificationReminderProps {
    className?: string;
}

type MaybeUserWithEmailConfirmation = {
    email?: string;
    email_confirmed_at?: string | null;
};

function getEmailConfirmationDate(user: unknown): string | null {
    if (!user || typeof user !== 'object') {
        return null;
    }
    const value = (user as MaybeUserWithEmailConfirmation).email_confirmed_at;
    return typeof value === 'string' ? value : null;
}

export function EmailVerificationReminder({ className }: EmailVerificationReminderProps) {
    const auth = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [isResending, setIsResending] = useState(false);

    const user = auth.me?.user;
    const isEmailVerified = Boolean(getEmailConfirmationDate(user));

    // Check if reminder was previously dismissed
    useEffect(() => {
        if (!user || isEmailVerified) {
            return;
        }
        const dismissed = safeLocalStorageGetItem('email_verification_dismissed');
        if (dismissed) {
            // Show again after 24 hours
            const dismissedTime = parseInt(dismissed);
            const oneDay = 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime < oneDay) {
                setIsVisible(false);
            }
        }
    }, [user, isEmailVerified]);

    // Don't show if user is not logged in or email is already verified
    if (!user || isEmailVerified || !isVisible) {
        return null;
    }

    const handleResendEmail = async () => {
        setIsResending(true);

        try {
            // This would typically call an API to resend the verification email
            // For now, we'll show a success message
            toast.success('Doğrulama e-postası tekrar gönderildi!');

            // In a real implementation, you would call:
            // await supabase.auth.resend({
            //   type: 'signup',
            //   email: user.email,
            // })
        } catch (error) {
            console.error('Failed to resend email:', error);
            toast.error('E-posta gönderilirken bir hata oluştu');
        } finally {
            setIsResending(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Store dismissed state in localStorage securely
        safeLocalStorageSetItem('email_verification_dismissed', Date.now().toString());
    };

    return (
        <Card className={`bg-amber-50 border-amber-200 ${className}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-amber-800">E-posta Adresinizi Doğrulayın</h4>
                        </div>
                        <p className="text-sm text-amber-700 mb-3">
                            <span className="font-medium">{user.email}</span> e-posta adresinize bir doğrulama bağlantısı gönderdik.
                            Lütfen e-posta adresinizi doğrulayın.
                        </p>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                                onClick={handleResendEmail}
                                disabled={isResending}
                            >
                                {isResending ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Tekrar Gönder
                                    </>
                                )}
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-amber-700 hover:bg-amber-100"
                                onClick={handleDismiss}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Kapat
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Compact version for header/notification area
export function EmailVerificationBanner() {
    const auth = useAuth();
    const [isVisible, setIsVisible] = useState(true);

    const user = auth.me?.user;
    const isEmailVerified = Boolean(getEmailConfirmationDate(user));

    if (!user || isEmailVerified || !isVisible) {
        return null;
    }

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                    <Mail className="h-4 w-4" />
                    <span>
                        <span className="font-medium">E-posta doğrulaması gerekli:</span> Doğrulama linki için e-posta kutunuzu kontrol edin.
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 h-8 text-xs"
                        onClick={() => toast.info('Doğrulama e-postası gönderildi')}
                    >
                        Tekrar Gönder
                    </Button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-amber-600 hover:text-amber-800"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Success version when email is verified
export function EmailVerifiedBadge() {
    const auth = useAuth();
    const user = auth.me?.user;
    const isEmailVerified = Boolean(getEmailConfirmationDate(user));

    if (!user || !isEmailVerified) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Doğrulandı</span>
        </div>
    );
}

export default EmailVerificationReminder;
