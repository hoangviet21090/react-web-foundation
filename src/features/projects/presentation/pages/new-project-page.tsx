import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ProjectForm } from '../components/project-form';
export function NewProjectPage({ backHref }: { backHref: string }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost">
        <Link to={backHref}>
          <ArrowLeft aria-hidden="true" />
          {t('projects.cancel')}
        </Link>
      </Button>
      <h1 className="text-3xl font-semibold tracking-tight">{t('projects.new')}</h1>
      <ProjectForm />
    </div>
  );
}
