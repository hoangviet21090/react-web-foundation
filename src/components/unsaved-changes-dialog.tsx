import { useTranslation } from 'react-i18next';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { ConfirmDialog } from '@/components/confirm-dialog';
export function UnsavedChangesDialog({ dirty }: { dirty: boolean }) {
  const { t } = useTranslation();
  const blocker = useUnsavedChanges(dirty);
  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title={t('common.unsavedTitle')}
      description={t('common.unsavedDescription')}
      confirmLabel={t('common.leave')}
      cancelLabel={t('common.stay')}
      onConfirm={() => {
        if (blocker.state === 'blocked') blocker.proceed();
      }}
      onCancel={() => {
        if (blocker.state === 'blocked') blocker.reset();
      }}
    />
  );
}
