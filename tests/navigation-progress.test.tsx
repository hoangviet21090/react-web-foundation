import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { NavigationProgress } from '@/routes/navigation-progress';
import { createI18n } from '@/config/i18n';

describe('Lazy route navigation feedback', () => {
  it('announces progress while a destination loads and clears it when navigation finishes', async () => {
    let finish: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const i18n = await createI18n('en');
    const router = createMemoryRouter([
      {
        element: (
          <>
            <NavigationProgress />
            <Outlet />
          </>
        ),
        children: [
          { path: '/', element: <h1>Current page</h1> },
          {
            path: '/next',
            lazy: async () => {
              await ready;
              return { Component: () => <h1>Next page</h1> };
            },
          },
        ],
      },
    ]);
    render(
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>,
    );
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    let navigation: Promise<void> | undefined;
    act(() => {
      navigation = router.navigate('/next');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    expect(screen.getByRole('heading', { name: 'Current page' })).toBeVisible();
    await act(async () => {
      finish();
      await navigation;
    });
    expect(screen.getByRole('heading', { name: 'Next page' })).toBeVisible();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    router.dispose();
  });
});
