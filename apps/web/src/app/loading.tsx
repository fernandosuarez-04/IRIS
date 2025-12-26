export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-neutral-600">Cargando...</p>
            </div>
        </div>
    );
}
