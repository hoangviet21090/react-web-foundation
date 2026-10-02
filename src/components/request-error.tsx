import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { AppError, getErrorKind } from '@/usecases/app-error';
import { DomainError } from '@/entities/domain-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export function RequestError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  const kind = getErrorKind(error);
  const code = error instanceof AppError || error instanceof DomainError ? error.code : undefined;
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{t(`errors.${kind}`)}</AlertTitle>
      <AlertDescription>{code !== undefined ? String(code) : null}</AlertDescription>
    </Alert>
  );
}
