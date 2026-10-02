import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/projects/project-form';
import { projectsHref } from '@/constants/routes';

export function NewProjectPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost">
        <Link to={projectsHref()}>
          <ArrowLeft aria-hidden="true" />
          {t('projects.cancel')}
        </Link>
      </Button>
      <h1 className="text-3xl font-semibold tracking-tight">{t('projects.new')}</h1>
      <ProjectForm />
    </div>
  );
}
