import { useTranslation } from 'react-i18next';
import { LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { LoginForm } from '../components/login-form';

export function LoginPage({ demoMode = false }: { demoMode?: boolean }) {
  const { t } = useTranslation();
  return (
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
  );
}
