import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CompareBar } from './CompareBar';
import { SupportWidget } from './SupportWidget';
import { useAuth } from '@/lib/auth-context';
import { Navigate } from '@/lib/router-context';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <CompareBar />
      <SupportWidget />
      <Footer />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">در حال بارگذاری...</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="py-12 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card p-8 text-center flex flex-col items-center gap-3">
      {icon && <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">{icon}</div>}
      <h3 className="text-lg font-600 text-gray-800">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-md">{description}</p>}
      {action}
    </div>
  );
}
