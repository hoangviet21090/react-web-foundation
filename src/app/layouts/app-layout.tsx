import { OfflineBanner } from '@/shared/components/offline-banner';
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PanelsTopLeft, FlaskConical, LogOut } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { env } from '@/shared/infrastructure/config/env';
import { useAuth } from '@/features/auth/presentation/hooks/use-auth';
import { AppearanceControls } from '../preferences/appearance-controls';
import { hasPermission } from '@/features/auth/domain/auth';
import { cn } from '@/shared/lib/cn';
import { APP_ROUTES } from '../routing/routes';
import { APP_NAVIGATION } from '../routing/navigation';

export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { auth, state } = useAuth();
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.pathname]);
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only z-50 rounded bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('app.skip')}
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link to={APP_ROUTES.projects.path} className="flex items-center gap-3">
            <span className="rounded-xl bg-primary p-2.5 text-primary-foreground">
              <PanelsTopLeft className="size-6" aria-hidden="true" />
            </span>
            <span className="text-xl font-bold tracking-tight">{t('app.name')}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {state.user?.name}
            </span>
            <AppearanceControls />
            <Button
              variant="outline"
              onClick={() => {
                void auth.logout();
              }}
            >
              <LogOut aria-hidden="true" />
              {t('auth.signOut')}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8">
        <aside>
          <p className="mb-4 px-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {t('app.workspace')}
          </p>
          <nav aria-label={t('app.menu')}>
            {APP_NAVIGATION.filter(
              ({ route }) =>
                !('permission' in route) || hasPermission(state.user, route.permission),
            ).map(({ route, label, icon: Icon }) => (
              <NavLink
                key={route.id}
                to={route.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  )
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                {t(label)}
              </NavLink>
            ))}
          </nav>
          <p className="mt-6 hidden px-3 text-sm leading-relaxed text-muted-foreground lg:block">
            {t('app.tagline')}
          </p>
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0 space-y-6 outline-none">
          {env.VITE_ENABLE_MOCKS === 'true' && (
            <Alert>
              <FlaskConical aria-hidden="true" />
              <AlertTitle className="flex items-center gap-2">
                {t('app.demo')}
                <Badge variant="outline">MSW</Badge>
              </AlertTitle>
              <AlertDescription>{t('app.demoDescription')}</AlertDescription>
            </Alert>
          )}
          <OfflineBanner />
          <Outlet />
          <footer className="border-t pt-6 text-xs text-muted-foreground">{t('app.footer')}</footer>
        </main>
      </div>
    </div>
  );
}
