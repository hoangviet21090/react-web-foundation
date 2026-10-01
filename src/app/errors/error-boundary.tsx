import { Component } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import type { ErrorReporter } from '@/shared/application/ports/error-reporter';
export class ErrorBoundary extends Component<
  PropsWithChildren<{ fallback: ReactNode; reporter: ErrorReporter }>,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.reporter.report(error, 'react');
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
