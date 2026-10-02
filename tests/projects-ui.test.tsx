import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { ProjectForm } from '@/components/projects/project-form';
import { ProjectsPage } from '@/pages/projects-page';
import { Provider } from 'react-redux';
import { createAppRuntime } from '@/config/runtime';
import { server } from './server';
import { failure, success } from '@/mocks/response';
import { mockApiUrl } from '@/mocks/handlers';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderFlow() {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  const runtime = await createAppRuntime();
  await runtime.i18n.changeLanguage('en');
  await runtime.auth.login({ email: 'demo@example.test', password: 'Demo123!' });
  runtime.queryClient.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false, networkMode: 'always' },
  });
  render(
    <I18nextProvider i18n={runtime.i18n}>
      <Provider store={runtime.store}>
        <QueryClientProvider client={runtime.queryClient}>
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
        </QueryClientProvider>
      </Provider>
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
