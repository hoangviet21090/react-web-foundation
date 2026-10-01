import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { useErrorReporter } from '../observability/use-error-reporter';
import { ErrorPage } from './error-page';
export function RouteErrorPage() {
  const error = useRouteError();
  const reporter = useErrorReporter();
  useEffect(() => {
    reporter.report(error, 'router');
  }, [error, reporter]);
  return <ErrorPage />;
}
