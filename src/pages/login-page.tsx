import { useTranslation } from 'react-i18next';
import { LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { AppearanceControls } from '@/components/appearance-controls';
import { GuestOnly } from '@/routes/route-guards';
import { env } from '@/config/env';

export function LoginPage() {
  const { t } = useTranslation();
  const demoMode =
    (import.meta.env.MODE === 'mock' || import.meta.env.MODE === 'demo') &&
    env.VITE_ENABLE_MOCKS === 'true';
  return (
    <GuestOnly>
      <header className="flex items-center justify-end gap-3 border-b p-4">
        <AppearanceControls />
      </header>
      <main className="mx-auto w-full max-w-md px-5 py-12">
        <div className="mb-7 flex items-center gap-3">
          <span className="rounded-xl bg-primary p-3 text-primary-foreground">
            <LockKeyhole aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold">{t('auth.signIn')}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('auth.welcome')}</CardTitle>
            <CardDescription>{t('auth.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm demoMode={demoMode} />
          </CardContent>
        </Card>
      </main>
    </GuestOnly>
  );
}
