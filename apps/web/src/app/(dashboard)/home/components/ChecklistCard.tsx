import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from '@/components/ui/card';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistItem {
    id: string;
    label: string;
    completed: boolean;
    href: string;
}

interface ChecklistProps {
    checklist: ChecklistItem[];
    isAllComplete: boolean;
    completionPercent: number;
    completedCount: number;
}

function ProgressRing({ percent, size = 48 }: { percent: number; size?: number }) {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return (
        <svg
            width={size}
            height={size}
            className="transform -rotate-90"
            role="img"
            aria-label={`İlerleme: ${percent}% tamamlandı`}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/30"
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="text-primary transition-all duration-700 ease-out"
                aria-hidden="true"
            />
        </svg>
    );
}

export function ChecklistCard({ checklist, isAllComplete, completionPercent, completedCount }: ChecklistProps) {
    return (
        <Card className={cn('glass border-border/50 shadow-sm', isAllComplete && 'border-success/30')}>
            <CardHeader>
                <CardTitle className="text-base">
                    {isAllComplete ? 'Tebrikler! Kurulum Tamamlandı' : 'Kurulum Checklist'}
                </CardTitle>
                <CardDescription>
                    {isAllComplete ? 'Tüm adımları başarıyla tamamladınız' : 'Sitenizi yayınlamadan önce tamamlayın'}
                </CardDescription>
                <CardAction>
                    <div className="relative flex items-center justify-center">
                        <ProgressRing percent={completionPercent} size={48} />
                        <span className="absolute text-xs font-bold text-primary">{completionPercent}%</span>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{completedCount} / {checklist.length} tamamlandı</span>
                        <span>{completionPercent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-success transition-all duration-700 ease-out"
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                </div>
                <div className="space-y-1 stagger-children">
                    {checklist.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-center gap-3 py-2.5 px-3 -mx-3 hover:bg-muted/50 rounded-lg transition-colors duration-200"
                        >
                            {item.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                            ) : (
                                <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                            )}
                            <span className={cn('text-sm', item.completed ? 'text-muted-foreground line-through' : 'text-foreground')}>
                                {item.label}
                            </span>
                            {!item.completed && <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-auto" />}
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
