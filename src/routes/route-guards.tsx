import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, Link, createPath } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/entities/auth';
import type { Permission } from '@/entities/auth';
import type { AuthState } from '@/usecases/auth-session';
import { Button } from '@/components/ui/button';
import { RequestError } from '@/components/request-error';
import { RouteLoading } from '@/routes/route-loading';
import { safeReturnTo } from '@/routes/return-to';
import { APP_ROUTES } from '@/constants/routes';

function PendingSession({ state }: { state: Exclude<AuthState, { status: 'authenticated' }> }) {
  const { t } = useTranslation();
  const { auth } = useAuth();
  if (state.status === 'error')
    return (
      <main className="mx-auto max-w-xl space-y-5 p-8">
        <h1 className="text-2xl font-semibold">
          {t(state.operation === 'logout' ? 'auth.logoutFailed' : 'auth.restoreFailed')}
        </h1>
        <RequestError error={state.error} />
        <Button
          onClick={() => {
            void (state.operation === 'logout' ? auth.logout() : auth.restore());
          }}
        >
          {t('common.retry')}
        </Button>
      </main>
    );
  return <RouteLoading />;
}
export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();
  if (state.status === 'authenticated') return <Outlet />;
  if (state.status === 'anonymous')
    return (
      <Navigate to={APP_ROUTES.login.path} replace state={{ returnTo: createPath(location) }} />
    );
  return <PendingSession state={state} />;
}
export function GuestOnly({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();
  if (state.status === 'authenticated')
    return <Navigate to={safeReturnTo(location.state)} replace />;
  if (state.status === 'anonymous') return children;
  return <PendingSession state={state} />;
}
export function RequirePermission({ permission }: { permission: Permission }) {
  const { state } = useAuth();
  const { t } = useTranslation();
  if (state.status === 'authenticated' && hasPermission(state.user, permission)) return <Outlet />;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('auth.forbidden')}</h1>
      <p>{t('errors.forbidden')}</p>
      <Button asChild>
        <Link to={APP_ROUTES.projects.path}>{t('app.back')}</Link>
      </Button>
    </section>
  );
}
