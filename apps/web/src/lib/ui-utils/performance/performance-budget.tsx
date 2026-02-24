"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PerformanceBudgetProps {
    current: number;
    budget: number;
    label: string;
    unit?: string;
}

const PerformanceBudget: React.FC<PerformanceBudgetProps> = ({
    current,
    budget,
    label,
    unit = "KB",
}) => {
    const percentage = Math.min((current / budget) * 100, 100);
    const isOverBudget = current > budget;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className={cn(isOverBudget ? "text-red-500 font-semibold" : "text-muted-foreground")}>
                    {current.toFixed(1)}
                    {unit} / {budget}
                    {unit}
                </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-300",
                        percentage > 90 ? "bg-red-500" : percentage > 75 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {isOverBudget && (
                <p className="text-xs text-red-500">
                    Warning: Exceeds budget by {((current - budget)).toFixed(1)}
                    {unit}
                </p>
            )}
        </div>
    );
};

export { PerformanceBudget };
export type { PerformanceBudgetProps };
