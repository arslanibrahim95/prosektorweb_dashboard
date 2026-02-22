export default function Loading() {
    return (
        <div className="max-w-xl mx-auto">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
        </div>
    );
}
