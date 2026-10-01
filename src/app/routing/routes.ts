import type { ParseKeys } from 'i18next';
import type { Permission } from '@/features/auth/domain/auth';
import { updateProjectListSearch } from '@/features/projects/presentation/utils/project-list-search';
import type { ProjectListLocation } from '@/features/projects/presentation/types/project-list-location';

interface RouteDefinition {
  readonly id: string;
  readonly title?: ParseKeys;
  readonly path: `/${string}`;
  readonly permission?: Permission;
}

/** Browser routes only. API endpoints belong to each infrastructure adapter. */
export const APP_ROUTES = {
  root: { id: 'root', path: '/' },
  login: { id: 'login', title: 'auth.signIn', path: '/login' },
  projects: {
    id: 'projects',
    title: 'app.pageTitle',
    path: '/projects',
    permission: 'projects:read',
  },
  settings: { id: 'settings', title: 'app.settings', path: '/settings' },
  project: {
    id: 'project-detail',
    title: 'projects.detail',
    path: '/projects/:projectId',
    permission: 'projects:read',
  },
  editProject: {
    id: 'edit-project',
    title: 'projects.edit',
    path: '/projects/:projectId/edit',
    permission: 'projects:update',
  },
  newProject: {
    id: 'new-project',
    title: 'projects.new',
    path: '/projects/new',
    permission: 'projects:create',
  },
} as const satisfies Record<string, RouteDefinition>;

/** Typed query builder: consumers never concatenate or hand-encode query strings. */
export function projectsHref(params: Partial<ProjectListLocation> = {}): string {
  const search = updateProjectListSearch(new URLSearchParams(), params).toString();
  return APP_ROUTES.projects.path + (search ? '?' + search : '');
}

export function projectHref(id: string): string {
  return APP_ROUTES.project.path.replace(':projectId', encodeURIComponent(id));
}
export function editProjectHref(id: string): string {
  return APP_ROUTES.editProject.path.replace(':projectId', encodeURIComponent(id));
}
