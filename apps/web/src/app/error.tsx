'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 text-accent-red">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    ¡Algo salió mal!
                </h2>
                <p className="text-neutral-600 mb-6">
                    Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
                </p>
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-600/90 transition-colors"
                >
                    Intentar de nuevo
                </button>
            </div>
        </div>
    );
}
