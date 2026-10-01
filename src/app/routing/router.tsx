import { RootLayout } from '../layouts/root-layout';
import { createBrowserRouter, Navigate } from 'react-router';
import type { RouteObject } from 'react-router';
import { AppLayout } from '../layouts/app-layout';
import { RouteLoading } from './route-loading';
import { RouteErrorPage } from '../errors/route-error-page';
import { NotFoundPage } from '../errors/not-found-page';
import { RequireAuth, RequirePermission } from './guards/route-guards';
import { APP_ROUTES } from './routes';

/** Shared by browser bootstrap and integration tests using createMemoryRouter. */
export function createAppRoutes(): RouteObject[] {
  return [
    {
      id: APP_ROUTES.root.id,
      path: APP_ROUTES.root.path,
      Component: RootLayout,
      ErrorBoundary: RouteErrorPage,
      HydrateFallback: RouteLoading,
      children: [
        {
          id: APP_ROUTES.login.id,
          path: APP_ROUTES.login.path,
          lazy: async () => ({
            Component: (await import('./route-adapters/login-route')).LoginRoute,
          }),
        },
        {
          Component: RequireAuth,
          children: [
            {
              Component: AppLayout,
              children: [
                { index: true, element: <Navigate to={APP_ROUTES.projects.path} replace /> },
                {
                  element: <RequirePermission permission={APP_ROUTES.projects.permission} />,
                  children: [
                    {
                      id: APP_ROUTES.projects.id,
                      path: APP_ROUTES.projects.path,
                      lazy: async () => ({
                        Component: (await import('./route-adapters/projects-route')).ProjectsRoute,
                      }),
                    },
                  ],
                },
                {
                  element: <RequirePermission permission={APP_ROUTES.newProject.permission} />,
                  children: [
                    {
                      id: APP_ROUTES.newProject.id,
                      path: APP_ROUTES.newProject.path,
                      lazy: async () => ({
                        Component: (await import('./route-adapters/new-project-route'))
                          .NewProjectRoute,
                      }),
                    },
                  ],
                },
                {
                  path: APP_ROUTES.settings.path,
                  id: APP_ROUTES.settings.id,
                  lazy: async () => ({
                    Component: (await import('../preferences/preferences-page')).PreferencesPage,
                  }),
                },
                {
                  element: <RequirePermission permission={APP_ROUTES.project.permission} />,
                  children: [
                    {
                      path: APP_ROUTES.project.path,
                      id: APP_ROUTES.project.id,
                      lazy: async () => ({
                        Component: (await import('./route-adapters/project-detail-route'))
                          .ProjectDetailRoute,
                      }),
                    },
                  ],
                },
                {
                  element: <RequirePermission permission={APP_ROUTES.editProject.permission} />,
                  children: [
                    {
                      path: APP_ROUTES.editProject.path,
                      id: APP_ROUTES.editProject.id,
                      lazy: async () => ({
                        Component: (await import('./route-adapters/edit-project-route'))
                          .EditProjectRoute,
                      }),
                    },
                  ],
                },
                { path: '*', Component: NotFoundPage },
              ],
            },
          ],
        },
      ],
    },
  ];
}
export function createAppRouter() {
  return createBrowserRouter(createAppRoutes());
}
