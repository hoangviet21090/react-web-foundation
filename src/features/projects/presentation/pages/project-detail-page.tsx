import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { RequestError } from '@/shared/components/request-error';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { useNotifications } from '@/shared/hooks/use-notifications';
import { useOnline } from '@/shared/hooks/use-online';
import { formatMoney } from '@/shared/lib/format-money';
import { formatDateTime } from '@/shared/lib/format-date-time';
import { useProject } from '../hooks/use-project';
import { useDeleteProject } from '../hooks/use-delete-project';
export function ProjectDetailPage({
  id,
  backHref,
  editHref,
  canDelete,
  onDeleted,
}: {
  id: string;
  backHref: string;
  editHref: string | null;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const { t, i18n } = useTranslation();
  const query = useProject(id);
  const deletion = useDeleteProject(id);
  const online = useOnline();
  const { notify } = useNotifications();
  const [confirm, setConfirm] = useState(false);
  async function remove() {
    if (!query.data) return;
    try {
      await deletion.mutateAsync(query.data.version);
      setConfirm(false);
      notify({ message: t('projects.deleted'), tone: 'success' });
      onDeleted();
    } catch {
      setConfirm(false);
    }
  }
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link to={backHref}>{t('projects.cancel')}</Link>
      </Button>
      <h1 className="text-3xl font-semibold">{t('projects.detail')}</h1>
      {query.isPending ? (
        <p role="status">
          {t(query.fetchStatus === 'paused' ? 'common.offline' : 'projects.loading')}
        </p>
      ) : query.isError ? (
        <div className="space-y-3">
          <RequestError error={query.error} />
          <Button
            onClick={() => {
              void query.refetch();
            }}
          >
            {t('projects.retry')}
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <h2 className="text-xl font-semibold">{query.data.name}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">{t('projects.reference')}</dt>
                <dd>{query.data.reference}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('projects.budget')}</dt>
                <dd>{formatMoney(query.data.budget, i18n.language, query.data.currency)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('projects.status')}</dt>
                <dd>{t(`projects.${query.data.status}`)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t('projects.createdAt')}</dt>
                <dd>{formatDateTime(query.data.createdAt, i18n.language)}</dd>
              </div>
            </dl>
            {deletion.isError && <RequestError error={deletion.error} />}
            <div className="flex gap-3">
              {editHref && (
                <Button asChild>
                  <Link to={editHref}>{t('projects.edit')}</Link>
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  disabled={!online || deletion.isPending}
                  onClick={() => setConfirm(true)}
                >
                  {t('projects.delete')}
                </Button>
              )}
            </div>
            <ConfirmDialog
              open={confirm}
              pending={deletion.isPending}
              title={t('projects.deleteTitle')}
              description={t('projects.deleteDescription')}
              confirmLabel={t('projects.delete')}
              cancelLabel={t('common.cancel')}
              onConfirm={() => {
                void remove();
              }}
              onCancel={() => setConfirm(false)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
