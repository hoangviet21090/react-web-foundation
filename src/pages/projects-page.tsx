import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileText, Plus, Search, Wallet, NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RequestError } from '@/components/request-error';
import { formatDateTime } from '@/utils/format-date-time';
import { formatMoney } from '@/utils/format-money';
import { useProjects } from '@/hooks/use-projects';
import { useProjectListLocation } from '@/hooks/use-project-list-location';
import { PROJECT_LIST_PAGE_SIZE } from '@/constants/project-list';
import { APP_ROUTES, projectHref } from '@/constants/routes';
import { hasPermission } from '@/entities/auth';
import { useAuth } from '@/hooks/use-auth';

export function ProjectsPage() {
  const { state } = useAuth();
  const canCreate = hasPermission(state.user, APP_ROUTES.newProject.permission);
  const { t, i18n } = useTranslation();
  const { page, search, changePage, changeSearch } = useProjectListLocation();
  const query = useProjects({ page, pageSize: PROJECT_LIST_PAGE_SIZE, search });
  const pages = Math.max(1, Math.ceil((query.data?.totalCount ?? 0) / PROJECT_LIST_PAGE_SIZE));
  const items = query.data?.items ?? [];
  const stats = [
    { label: t('projects.total'), value: query.data?.totalCount ?? '—', icon: FileText },
    {
      label: t('projects.pageBudget'),
      value: query.data
        ? formatMoney(
            items.reduce((sum, project) => sum + project.budget, 0),
            i18n.language,
          )
        : '—',
      icon: Wallet,
    },
    {
      label: t('projects.pageDrafts'),
      value: query.data ? items.filter((project) => project.status === 'draft').length : '—',
      icon: NotebookPen,
    },
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('app.pageTitle')}</h1>
          <p className="mt-2 text-muted-foreground">{t('app.pageDescription')}</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to={APP_ROUTES.newProject.path}>
              <Plus aria-hidden="true" />
              {t('projects.new')}
            </Link>
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
              </div>
              <div className="rounded-xl bg-accent p-3 text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="gap-5">
          <div>
            <CardTitle>{t('projects.title')}</CardTitle>
            <CardDescription className="mt-2">{t('projects.description')}</CardDescription>
          </div>
          <form
            key={search}
            className="flex flex-wrap gap-2"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const value = data.get('search');
              changeSearch(typeof value === 'string' ? value : '');
            }}
          >
            <div className="relative min-w-48 flex-1">
              <Search
                className="absolute top-2.5 left-3 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                name="search"
                defaultValue={search}
                aria-label={t('projects.search')}
                placeholder={t('projects.search')}
                className="pl-9"
              />
            </div>
            <Button variant="outline" type="submit">
              {t('projects.searchAction')}
            </Button>
            {search && (
              <Button type="button" variant="ghost" onClick={() => changeSearch('')}>
                {t('projects.clear')}
              </Button>
            )}
          </form>
        </CardHeader>
        <CardContent aria-busy={query.isFetching}>
          {query.isPending ? (
            <div role="status" className="space-y-3">
              <span className="sr-only">
                {t(query.fetchStatus === 'paused' ? 'common.offline' : 'projects.loading')}
              </span>
              {[1, 2, 3].map((id) => (
                <Skeleton key={id} className="h-16 w-full" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="space-y-3">
              <RequestError error={query.error} />
              <Button
                variant="outline"
                onClick={() => {
                  void query.refetch();
                }}
              >
                {t('projects.retry')}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-14 text-center">
              <FileText className="mx-auto mb-4 size-10 text-muted-foreground" aria-hidden="true" />
              <h2 className="font-semibold">{t('projects.empty')}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t('projects.emptyDescription')}</p>
            </div>
          ) : (
            <div
              className="overflow-x-auto rounded-md focus-visible:ring-2 focus-visible:ring-ring"
              role="region"
              aria-label={t('projects.title')}
              tabIndex={0}
            >
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{t('projects.title')}</caption>
                <thead>
                  <tr className="border-b text-muted-foreground">
                    {(['reference', 'name', 'budget', 'status', 'createdAt'] as const).map(
                      (key) => (
                        <th key={key} scope="col" className="px-3 py-3 font-medium">
                          {t(`projects.${key}`)}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((project) => (
                    <tr key={project.id} className="border-b last:border-0 hover:bg-muted/50">
                      <th scope="row" className="px-3 py-5 font-medium whitespace-nowrap">
                        <Link className="underline underline-offset-4" to={projectHref(project.id)}>
                          {project.reference}
                        </Link>
                      </th>
                      <td className="px-3 py-5 whitespace-nowrap">{project.name}</td>
                      <td className="px-3 py-5 whitespace-nowrap tabular-nums">
                        {formatMoney(project.budget, i18n.language)}
                      </td>
                      <td className="px-3 py-5">
                        <Badge variant={project.status === 'archived' ? 'default' : 'secondary'}>
                          {t(`projects.${project.status}`)}
                        </Badge>
                      </td>
                      <td className="px-3 py-5 whitespace-nowrap text-muted-foreground">
                        {formatDateTime(project.createdAt, i18n.language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!query.isPending && !query.isError && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {query.isFetching
                  ? t('projects.refreshing')
                  : t('projects.pagination', { page, pages, total: query.data.totalCount })}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || query.isPlaceholderData}
                  onClick={() => changePage(page - 1)}
                >
                  {t('projects.previous')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pages || query.isPlaceholderData}
                  onClick={() => changePage(page + 1)}
                >
                  {t('projects.next')}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
