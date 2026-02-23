'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loader2, User, ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';
import { listAuthUsers, deleteAuthUser } from '@/actions/supabase-auth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { SupabaseAuthUser } from '../types/supabase';

export function AuthUsersPanel() {
    const [authUsers, setAuthUsers] = useState<SupabaseAuthUser[]>([]);
    const [isLoadingAuth, setIsLoadingAuth] = useState(false);
    const [authError, setAuthError] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAuthUsers = useCallback(async () => {
        setIsLoadingAuth(true);
        setAuthError('');
        try {
            const result = await listAuthUsers();
            if (result.success) {
                setAuthUsers(result.data || []);
            } else {
                setAuthError(result.error || 'Kullanıcılar yüklenemedi. Service Role Key gerekli olabilir.');
            }
        } catch (error) {
            logger.error('Failed to fetch auth users', { error });
            setAuthError('Kullanıcılar yüklenemedi. Service Role Key gerekli olabilir.');
        } finally {
            setIsLoadingAuth(false);
        }
    }, []);

    const handleDeleteAuthUser = async (id: string) => {
        setIsDeleting(true);
        try {
            const result = await deleteAuthUser(id);
            if (result.success) {
                toast.success('Kullanıcı silindi.');
                fetchAuthUsers();
            } else {
                toast.error(`Silme hatası: ${result.error}`);
            }
        } catch (error) {
            logger.error('Failed to delete auth user', { error });
            toast.error('Kullanıcı silinemedi.');
        } finally {
            setIsDeleting(false);
            setConfirmDialog(null);
        }
    };

    return (
        <>
            <Card className="glass border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Auth Kullanıcıları
                        </CardTitle>
                        <CardDescription>
                            Supabase Auth (&apos;auth.users&apos;) tablosundaki kullanıcılar.
                            <br />
                            <span className="text-xs text-warning">Görüntülemek için Service Role Key gereklidir.</span>
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchAuthUsers} disabled={isLoadingAuth}>
                        <RefreshCw className={`h-4 w-4 ${isLoadingAuth ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoadingAuth ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {authError ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                                    <ShieldAlert className="h-10 w-10 text-destructive/50" />
                                    <p className="text-muted-foreground max-w-md">{authError}</p>
                                    <p className="text-xs text-muted-foreground">Lütfen &apos;Ayarlar&apos; sekmesinden Service Role Key girildiğinden emin olun.</p>
                                </div>
                            ) : authUsers.length > 0 ? (
                                <div className="space-y-2">
                                    {authUsers.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-card/50">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{user.email}</span>
                                                <span className="text-xs text-muted-foreground">ID: {user.id}</span>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                        {user.role}
                                                    </Badge>
                                                    <Badge variant={user.email_confirmed_at ? "default" : "secondary"} className="text-[10px] h-4 px-1">
                                                        {user.email_confirmed_at ? 'Email Onaylı' : 'Onay Bekliyor'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setConfirmDialog({ id: user.id, name: user.email || user.id })}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">Kullanıcı bulunamadı.</div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!confirmDialog}
                onOpenChange={(open) => !open && setConfirmDialog(null)}
                title="Kullanıcıyı Sil"
                description={`'${confirmDialog?.name}' kullanıcısını silmek istediğinize emin misiniz?`}
                confirmLabel="Sil"
                onConfirm={() => {
                    if (confirmDialog) handleDeleteAuthUser(confirmDialog.id);
                }}
                isLoading={isDeleting}
            />
        </>
    );
}
