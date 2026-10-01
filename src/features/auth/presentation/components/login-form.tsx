import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { RequestError } from '@/shared/components/request-error';
import { AppError } from '@/shared/application/app-error';
import { useAuth } from '../hooks/use-auth';
import { loginSchema } from '../schemas/login-schema';
import type { LoginFormValues } from '../schemas/login-schema';

export function LoginForm({ demoMode = false }: { demoMode?: boolean }) {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });
  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await auth.login(values);
    } catch (cause) {
      setError(cause);
    }
  });
  return (
    <form className="space-y-5" noValidate onSubmit={submit} aria-busy={isSubmitting}>
      {error instanceof AppError && error.kind === 'unauthorized' ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{t('auth.invalidCredentials')}</AlertDescription>
        </Alert>
      ) : (
        Boolean(error) && <RequestError error={error} />
      )}
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          maxLength={254}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-sm text-destructive">
            {t('auth.emailError')}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="text-sm text-destructive">
            {t('auth.passwordError')}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {t(isSubmitting ? 'auth.signingIn' : 'auth.signIn')}
      </Button>
      {demoMode && (
        <Alert>
          <AlertDescription>{t('auth.demoCredentials')}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
