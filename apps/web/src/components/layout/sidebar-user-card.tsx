import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/components/auth/auth-provider';

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Süper Admin',
    owner: 'Hesap Sahibi',
    admin: 'Yönetici',
    editor: 'Editör',
    viewer: 'İzleyici',
};

interface UserCardProps {
    collapsed: boolean;
}

const UserCardContent = ({ collapsed }: UserCardProps) => {
    const auth = useAuth();
    const user = auth.me;

    const userName = user?.user?.name;
    const initials = userName
        ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    if (collapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <div className="flex justify-center p-2">
                        <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 ring-2 ring-white/10 cursor-default">
                            <span className="text-[11px] font-bold text-white">{initials}</span>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-medium text-[13px]">
                    {userName ?? 'Kullanıcı'}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div className="mx-2 mb-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20 ring-2 ring-white/10">
                <span className="text-[11px] font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white/90 truncate leading-tight">
                    {userName ?? 'Kullanıcı'}
                </p>
                <p className="text-[11px] text-white/35 truncate leading-tight mt-0.5">
                    {user?.role ? (ROLE_LABELS[user.role] ?? user.role) : '—'}
                </p>
            </div>
            <div className="shrink-0">
                <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
            </div>
        </div>
    );
};

export const UserCard = memo(function UserCard({ collapsed }: UserCardProps) {
    return <UserCardContent collapsed={collapsed} />;
});

export { ROLE_LABELS };
