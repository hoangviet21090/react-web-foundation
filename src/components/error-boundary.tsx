import { Component } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { getAppRuntime } from '@/config/runtime';

export class ErrorBoundary extends Component<
  PropsWithChildren<{ fallback: ReactNode }>,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    getAppRuntime().reporter.report(error, 'react');
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
