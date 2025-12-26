import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación | IRIS',
  description: 'Inicia sesión o regístrate en IRIS para continuar tu aprendizaje',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white">
      {children}
    </main>
  );
}
