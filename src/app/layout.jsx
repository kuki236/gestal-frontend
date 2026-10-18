import { Inter } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const fontSans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Gestal — Servicios Universitarios | UNMSM',
  description:
    'Sistema de Gestión Integral de Servicios Universitarios de la Universidad Nacional Mayor de San Marcos.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={fontSans.variable}>
      <body className="bg-[#F4F2EE] text-[#1C242B] font-sans antialiased">
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <ToastProvider>{children}</ToastProvider>
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
