export default function HomePage() {
    return (
        <main className="min-h-screen bg-neutral-100">
            <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-8 text-neutral-900">
                        Bienvenido a <span className="text-primary-600">IRIS</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto text-neutral-600">
                        Plataforma educativa moderna con inteligencia artificial integrada
                        para una experiencia de aprendizaje personalizada.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-600/90 transition-colors">
                            Comenzar
                        </button>
                        <button className="px-6 py-3 bg-white text-neutral-900 rounded-lg font-medium border border-neutral-200 hover:bg-neutral-100 transition-colors">
                            Saber más
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
