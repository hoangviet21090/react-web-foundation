import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { ProjectForm } from '@/features/projects/presentation/components/project-form';
import { ProjectsPage } from '@/features/projects/presentation/pages/projects-page';
import { ProjectsProvider } from '@/features/projects/presentation/providers/projects-provider';
import { createI18n } from '@/shared/infrastructure/i18n/i18n';
import { createHttpClient } from '@/shared/infrastructure/http/http-client';
import { createHttpProjectService } from '@/features/projects/infrastructure/services/http-project-service';
import { createHttpProjectRepository } from '@/features/projects/infrastructure/repositories/http-project-repository';
import { createProjectUseCases } from '@/features/projects/application/project-use-cases';
import { issueMockSession } from '@/mocks/auth-handlers';
import { server } from './server';
import { failure, mockApiUrl, success } from '@/mocks/handlers';

async function renderFlow() {
  const i18n = await createI18n('en');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const httpClient = createHttpClient({ baseURL: 'http://localhost/api', timeoutMs: 1000 });
  httpClient.defaults.headers.common.Authorization = 'Bearer ' + issueMockSession().accessToken;
  const useCases = createProjectUseCases(
    createHttpProjectRepository(createHttpProjectService(httpClient)),
  );
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <ProjectsProvider useCases={useCases}>
          <RouterProvider
            router={createMemoryRouter([
              {
                path: '/',
                element: (
                  <>
                    <ProjectForm />
                    <ProjectsPage />
                  </>
                ),
              },
            ])}
          />
        </ProjectsProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  );
  return userEvent.setup();
}
describe('Projects UI with real adapters and MSW', () => {
  it('validates inputs, creates a draft and invalidates the list', async () => {
    const user = await renderFlow();
    await screen.findByRole('cell', { name: 'Nguyễn An (demo)' });
    await user.click(screen.getByRole('button', { name: 'Create draft' }));
    expect(await screen.findByText('Use between 2 and 100 characters.')).toBeVisible();
    await user.type(screen.getByLabelText('Project name'), 'New Demo Project');
    await user.type(screen.getByLabelText('Budget (USD)'), '1500000');
    await user.click(screen.getByRole('button', { name: 'Create draft' }));
    expect(await screen.findByText('Draft created successfully.')).toBeVisible();
    expect(await screen.findByRole('cell', { name: 'New Demo Project' })).toBeVisible();
  });
  it('preserves form values when the server rejects a request', async () => {
    server.use(
      http.post(mockApiUrl, () => HttpResponse.json(failure('Rejected', 'PROJECT_REJECTED'))),
    );
    const user = await renderFlow();
    await user.type(screen.getByLabelText('Project name'), 'Retry Demo');
    await user.type(screen.getByLabelText('Budget (USD)'), '500');
    await user.click(screen.getByRole('button', { name: 'Create draft' }));
    expect(
      await screen.findByText('The request was not accepted. Check the details.'),
    ).toBeVisible();
    expect(screen.getByLabelText('Project name')).toHaveValue('Retry Demo');
  });
  it('renders an empty state', async () => {
    server.use(
      http.get(mockApiUrl, () =>
        HttpResponse.json(success({ items: [], totalCount: 0, page: 1, pageSize: 5 })),
      ),
    );
    await renderFlow();
    expect(await screen.findByRole('heading', { name: 'No matching projects' })).toBeVisible();
  });
  it('shows a recoverable request error and retries successfully', async () => {
    server.use(http.get(mockApiUrl, () => HttpResponse.json({}, { status: 503 }), { once: true }));
    const user = await renderFlow();
    expect(await screen.findByRole('alert')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    const table = await screen.findByRole('table');
    expect(within(table).getByRole('cell', { name: 'Nguyễn An (demo)' })).toBeVisible();
  });
});
