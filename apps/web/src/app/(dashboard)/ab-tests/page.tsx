'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { logger } from '@/lib/logger'

// Components - Dynamic import to avoid SSR issues with some deps if any
const ABTestDashboard = dynamic(
    () => import('@/features/ab-testing/components/ABTestDashboard'),
    { ssr: false }
)
const ABTestForm = dynamic(
    () => import('@/features/ab-testing/components/ABTestForm'),
    { ssr: false }
)
// Results component can be added later or navigated to

export default function ABTestsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const queryClient = useQueryClient()

    const handleCreateSuccess = () => {
        setIsCreateOpen(false)
        // Invalidate AB tests queries to trigger a fresh fetch
        void queryClient.invalidateQueries({ queryKey: ['ab-tests'] })
    }

    const handleTestSelect = (id: string) => {
        // Navigate to details - implement navigation when detail page is ready
        // For MVP: navigate to the detail page if it exists
        // For now: router.push(`/ab-tests/${id}`)
        logger.info('Selected test', { id })
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">A/B Testleri</h1>
                    <p className="text-muted-foreground">
                        Dönüşüm oranlarını artırmak için testler oluşturun ve yönetin.
                    </p>
                </div>
                {/* The Dashboard component has its own create button, but we can have one here too */}
            </div>

            <ABTestDashboard
                onCreateNew={() => setIsCreateOpen(true)}
                onTestSelect={handleTestSelect}
            />

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Yeni A/B Testi Oluştur</DialogTitle>
                    </DialogHeader>
                    <ABTestForm
                        onSuccess={handleCreateSuccess}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
