import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { getAppRuntime } from '@/config/runtime';
import { ErrorPage } from '@/pages/error-page';

export function RouteErrorPage() {
  const error = useRouteError();
  const reporter = getAppRuntime().reporter;
  useEffect(() => {
    reporter.report(error, 'router');
  }, [error, reporter]);
  return <ErrorPage />;
}
