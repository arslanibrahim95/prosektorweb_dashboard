import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'A/B Testleri - ProsektorWeb',
    description: 'A/B testlerini yönetin ve analiz edin.',
}

export default function ABTestLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-1 w-full space-y-6">
                {children}
            </div>
        </div>
    )
}
