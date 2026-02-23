import { memo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useSidebar } from './app-shell';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NavIcons, NAV_ICON_SIZE_CLASS, CHILD_ICON_SIZE_CLASS } from './sidebar-nav-icons';
import type { NavItem } from './sidebar-nav-data';
import type { NavIconName } from './sidebar-nav-icons';

interface NavItemComponentProps {
    item: NavItem;
    depth?: number;
    collapsed?: boolean;
    unreadCount?: number;
}

const IconRenderer = ({ name, sizeClass }: { name: NavIconName; sizeClass: string }) => {
    const IconComponent = NavIcons[name];
    if (!IconComponent) return null;
    return <IconComponent className={sizeClass} />;
};

const NavItemComponentInner = ({
    item,
    depth = 0,
    collapsed = false,
    unreadCount = 0,
}: NavItemComponentProps) => {
    const pathname = usePathname();
    const { closeMobile } = useSidebar();
    const [isExpanded, setIsExpanded] = useState(
        () => item.children?.some(child => pathname.startsWith(child.href)) ?? false
    );

    const isActive = pathname === item.href
        || (item.children && item.children.some(child => pathname.startsWith(child.href)));
    const isLeafActive = pathname === item.href;
    const hasChildren = !!item.children?.length;
    const showBadge = item.href === '/inbox' && unreadCount > 0;

    if (hasChildren) {
        const trigger = (
            <button
                type="button"
                onClick={() => !collapsed && setIsExpanded(v => !v)}
                aria-expanded={isExpanded}
                aria-label={item.label}
                className={cn(
                    'w-full flex items-center rounded-xl text-[13px] font-medium',
                    'transition-all duration-200 ease-out select-none',
                    collapsed ? 'justify-center px-2.5 py-2.5' : 'justify-between px-3 py-2',
                    isActive
                        ? 'bg-white/[0.09] text-white'
                        : 'text-white/60 hover:text-white/90 hover:bg-white/[0.05]',
                )}
            >
                <div className={cn('flex items-center', collapsed ? '' : 'gap-2.5')}>
                    <span className={cn(
                        'shrink-0 transition-colors duration-200',
                        isActive ? (item.color ?? 'text-white') : 'text-white/40 group-hover:text-white/70',
                        item.color && isActive ? item.color : '',
                    )}>
                        <IconRenderer name={item.icon} sizeClass={depth === 0 ? NAV_ICON_SIZE_CLASS : CHILD_ICON_SIZE_CLASS} />
                    </span>
                    {!collapsed && (
                        <span className={cn(isActive ? 'text-white' : '')}>{item.label}</span>
                    )}
                </div>
                {!collapsed && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        {showBadge && (
                            <span className="h-4 min-w-4 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                        <ChevronRight className={cn(
                            'h-3.5 w-3.5 text-white/30 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                        )} />
                    </div>
                )}
            </button>
        );

        return (
            <div>
                {collapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8} className="font-medium text-[13px]">
                            {item.label}
                            {showBadge && <span className="ml-1.5 text-emerald-400">({unreadCount})</span>}
                        </TooltipContent>
                    </Tooltip>
                ) : trigger}

                {!collapsed && (
                    <div className={cn(
                        'overflow-hidden transition-all duration-300 ease-out',
                        isExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0',
                    )}>
                        <div className="mt-0.5 ml-[22px] pl-3 border-l border-white/[0.07] space-y-0.5 pb-1">
                            {item.children!.map(child => (
                                <NavItemComponent
                                    key={child.href}
                                    item={child}
                                    depth={depth + 1}
                                    collapsed={collapsed}
                                    unreadCount={unreadCount}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const link = (
        <Link
            href={item.href}
            onClick={closeMobile}
            className={cn(
                'group relative flex items-center rounded-xl text-[13px] font-medium',
                'transition-all duration-200 ease-out select-none',
                collapsed
                    ? 'justify-center px-2.5 py-2.5'
                    : depth > 0
                        ? 'gap-2 px-2.5 py-[5px]'
                        : 'gap-2.5 px-3 py-2',
                depth === 0 && isLeafActive
                    ? 'bg-white/[0.09] text-white'
                    : depth > 0 && isLeafActive
                        ? 'text-white'
                        : 'text-white/55 hover:text-white/90 hover:bg-white/[0.04]',
            )}
        >
            {isLeafActive && !collapsed && depth === 0 && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
            )}
            {isLeafActive && !collapsed && depth > 0 && (
                <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary" />
            )}

            <span className={cn(
                'shrink-0 transition-colors duration-200',
                depth === 0 && isLeafActive ? (item.color ?? 'text-primary') : '',
                depth === 0 && !isLeafActive ? 'text-white/40' : '',
                depth > 0 && isLeafActive ? 'text-white/90' : '',
                depth > 0 && !isLeafActive ? 'text-white/35' : '',
            )}>
                <IconRenderer name={item.icon} sizeClass={depth === 0 ? NAV_ICON_SIZE_CLASS : CHILD_ICON_SIZE_CLASS} />
            </span>
            {!collapsed && (
                <span>{item.label}</span>
            )}
        </Link>
    );

    if (collapsed && depth === 0) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="font-medium text-[13px]">
                    {item.label}
                </TooltipContent>
            </Tooltip>
        );
    }

    return link;
};

export const NavItemComponent = memo(NavItemComponentInner, (prev, next) => {
    return (
        prev.item.href === next.item.href &&
        prev.depth === next.depth &&
        prev.collapsed === next.collapsed &&
        prev.unreadCount === next.unreadCount
    );
});

NavItemComponent.displayName = 'NavItemComponent';
