'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
    labels?: string[];
    className?: string;
}

export function ProgressIndicator({
    currentStep,
    totalSteps,
    labels = ['Hoş Geldin', 'Organizasyon', 'Tamamlandı'],
    className,
}: ProgressIndicatorProps) {
    return (
        <div className={cn('w-full max-w-md mx-auto mb-8', className)}>
            <div className="flex items-center justify-between relative">
                {/* Progress Line Background */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />

                {/* Progress Line Active */}
                <div
                    className="absolute top-5 left-0 h-0.5 bg-primary -z-10 transition-all duration-300 ease-in-out"
                    style={{
                        width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                    }}
                />

                {/* Steps */}
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;
                    const isPending = stepNumber > currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center">
                            {/* Step Circle */}
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                                    isCompleted && 'bg-primary text-white',
                                    isCurrent && 'bg-primary text-white ring-4 ring-primary/20',
                                    isPending && 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    stepNumber
                                )}
                            </div>

                            {/* Step Label */}
                            <span
                                className={cn(
                                    'mt-2 text-xs font-medium transition-colors duration-300',
                                    isCompleted && 'text-primary',
                                    isCurrent && 'text-primary',
                                    isPending && 'text-gray-400'
                                )}
                            >
                                {labels[index]}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Step Counter Text */}
            <p className="text-center mt-4 text-sm text-gray-500">
                Adım {currentStep} / {totalSteps}
            </p>
        </div>
    );
}

export default ProgressIndicator;
