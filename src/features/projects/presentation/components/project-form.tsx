import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import type { Project } from '@/features/projects/domain/project';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { RequestError } from '@/shared/components/request-error';
import { UnsavedChangesDialog } from '@/shared/components/unsaved-changes-dialog';
import { useOnline } from '@/shared/hooks/use-online';
import { useCreateProject } from '../hooks/use-create-project';
import { useUpdateProject } from '../hooks/use-update-project';
import { projectFormSchema } from '../schemas/project-form-schema';
import type { ProjectFormValues } from '../schemas/project-form-schema';

export function ProjectForm({ project }: { project?: Project }) {
  const { t } = useTranslation();
  const online = useOnline();
  // Keep the version matching the initial form values, even if background cache changes.
  const [editVersion, setEditVersion] = useState(project?.version ?? 1);
  const create = useCreateProject();
  const update = useUpdateProject(project?.id ?? '');
  const mutation = project ? update : create;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    mode: 'onTouched',
    defaultValues: project
      ? { name: project.name, budget: project.budget, status: project.status }
      : // Match valueAsNumber's empty value so reset does not leave a false dirty state.
        { name: '', budget: Number.NaN, status: 'draft' },
  });
  const submit = handleSubmit(async (values) => {
    try {
      if (project) {
        const saved = await update.mutateAsync({ ...values, version: editVersion });
        setEditVersion(saved.version);
        reset({ name: saved.name, budget: saved.budget, status: saved.status });
      } else {
        await create.mutateAsync({ name: values.name, budget: values.budget });
        reset();
      }
    } catch {
      /* Keep user input; mapped mutation error is rendered below. */
    }
  });
  const pending = isSubmitting || mutation.isPending;
  return (
    <Card>
      <UnsavedChangesDialog dirty={isDirty || pending} />
      <CardHeader>
        <CardTitle>{t(project ? 'projects.edit' : 'projects.formTitle')}</CardTitle>
        <CardDescription>{t('projects.formDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="space-y-6" aria-busy={pending}>
          {mutation.isSuccess && (
            <Alert role="status">
              <CheckCircle2 aria-hidden="true" />
              <AlertDescription>
                {t(project ? 'projects.updated' : 'projects.success')}
              </AlertDescription>
            </Alert>
          )}
          {mutation.isError && <RequestError error={mutation.error} />}
          <div className="space-y-2">
            <Label htmlFor="project-name">{t('projects.nameLabel')}</Label>
            <Input
              id="project-name"
              autoComplete="off"
              placeholder={t('projects.namePlaceholder')}
              maxLength={100}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'project-name-error' : undefined}
              disabled={pending}
              {...register('name')}
            />
            {errors.name && (
              <p id="project-name-error" role="alert" className="text-sm text-destructive">
                {t('validation.name')}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-budget">{t('projects.budgetLabel')}</Label>
            <Input
              id="project-budget"
              type="number"
              inputMode="numeric"
              min={1}
              max={1_000_000_000}
              step={1}
              aria-invalid={Boolean(errors.budget)}
              aria-describedby={errors.budget ? 'budget-help budget-error' : 'budget-help'}
              disabled={pending}
              {...register('budget', { valueAsNumber: true })}
            />
            <p id="budget-help" className="text-sm text-muted-foreground">
              {t('projects.budgetHelp')}
            </p>
            {errors.budget && (
              <p id="budget-error" role="alert" className="text-sm text-destructive">
                {t('validation.budget')}
              </p>
            )}
          </div>
          {project && (
            <div className="space-y-2">
              <Label htmlFor="project-status">{t('projects.status')}</Label>
              <select
                id="project-status"
                disabled={pending}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                {...register('status')}
              >
                {(['draft', 'active', 'archived'] as const).map((status) => (
                  <option key={status} value={status}>
                    {t(`projects.${status}`)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button type="submit" disabled={pending || !online} className="w-full">
            {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {t(pending ? 'projects.saving' : project ? 'projects.saveChanges' : 'projects.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
