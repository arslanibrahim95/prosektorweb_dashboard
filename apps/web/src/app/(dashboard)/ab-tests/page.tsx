'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

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
    const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
    // TODO: Add results view mode or navigation

    const handleCreateSuccess = () => {
        setIsCreateOpen(false)
        // Refresh dashboard handled by component's internal state usually, 
        // or we can add a refresh trigger if needed. 
        // For now, ABTestDashboard fetches on mount/update. 
        // Actually, we might need to trigger a re-fetch.
        // Ideally useQuery invalidation. 
        // As a simple fix, we can force re-mount or pass a refresh key.
        window.location.reload() // MVP simple refresh
    }

    const handleTestSelect = (id: string) => {
        // Navigate to details or show results
        // For MVP, maybe just log or show a "Not implemented" toast
        // OR: implement a results dialog/page
        // router.push(`/ab-tests/${id}`)
        console.log('Selected test:', id)
        // Check if we want to show results in a dialog or navigate
        // For now, let's keep it simple.
        window.location.href = `/ab-tests/${id}` // If we had a detail page
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
