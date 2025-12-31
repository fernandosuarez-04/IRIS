import type { Metadata } from 'next';
import AuthClientLayout from './AuthClientLayout';

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
    <AuthClientLayout>
      {children}
    </AuthClientLayout>
  );
}
