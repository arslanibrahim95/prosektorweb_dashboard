'use client';

import {
    LogOut,
    Settings,
    HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { replayWelcomeTour } from '@/components/onboarding/welcome-modal';

interface UserDropdownProps {
    user?: {
        name?: string;
        email?: string;
        avatar_url?: string;
    };
    tenantName?: string;
    onSignOut: () => Promise<void>;
}

export function UserDropdown({ user, tenantName, onSignOut }: UserDropdownProps) {
    const router = useRouter();

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : 'U';

    const handleSignOut = async () => {
        await onSignOut();
        router.replace('/login');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2.5 h-9 px-2 hover:bg-muted/50"
                    aria-label="Kullanıcı menüsünü aç"
                >
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/40">
                        {user?.avatar_url ? (
                            <Image
                                src={user.avatar_url}
                                alt={user?.name ? `${user.name} avatarı` : 'Kullanıcı avatarı'}
                                width={32}
                                height={32}
                                sizes="32px"
                                className="h-8 w-8 rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-[var(--font-size-xs)] font-bold text-white">{initials}</span>
                        )}
                    </div>
                    <div className="hidden sm:block text-left">
                        <span className="block text-sm font-medium leading-tight">
                            {user?.name || 'Kullanıcı'}
                        </span>
                        <span className="block text-[var(--font-size-xs)] text-muted-foreground leading-tight">
                            {tenantName ?? ''}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col">
                        <span className="font-medium">{user?.name || 'Kullanıcı'}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {user?.email || 'email@example.com'}
                        </span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings/users')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Ayarlar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => replayWelcomeTour()}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Rehberi Tekrar Oynat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
