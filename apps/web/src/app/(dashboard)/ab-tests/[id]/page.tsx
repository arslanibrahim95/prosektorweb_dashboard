'use client'

import { useEffect, useState, use } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const ABTestResults = dynamic(
    () => import('@/features/ab-testing/components/ABTestResults'),
    { ssr: false }
)

export default function ABTestDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    // Unwrap params using React.use() or await in async component (Next.js 15)
    // Since this is a client component, we use `use` hook for the promise.
    const { id } = use(params)

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Link href="/ab-tests">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Test Detayları</h1>
                    <p className="text-muted-foreground">
                        Test sonuçlarını ve istatistiksel analizi görüntüleyin.
                    </p>
                </div>
            </div>

            <ABTestResults testId={id} />
        </div>
    )
}
