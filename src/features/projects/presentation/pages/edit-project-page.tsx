import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { RequestError } from '@/shared/components/request-error';
import { useProject } from '../hooks/use-project';
import { ProjectForm } from '../components/project-form';
export function EditProjectPage({ id, backHref }: { id: string; backHref: string }) {
  const { t } = useTranslation();
  const query = useProject(id);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost">
        <Link to={backHref}>{t('projects.cancel')}</Link>
      </Button>
      <h1 className="text-3xl font-semibold">{t('projects.edit')}</h1>
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
        <ProjectForm key={id} project={query.data} />
      )}
    </div>
  );
}
