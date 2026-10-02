import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AppError } from '@/usecases/app-error';
import { OperationCancelledError } from '@/usecases/app-error';
import { createErrorReporter } from '@/utils/error-reporter';
import { observeBrowserErrors } from '@/utils/error-reporter';
import { useOnline } from '@/hooks/use-online';
import { requireOnline } from '@/utils/require-online';
import { parseEnv } from '@/config/env-schema';
import { formatMoney } from '@/utils/format-money';
import { formatDateTime } from '@/utils/format-date-time';

describe('Reusable browser foundation', () => {
  it('keeps only bounded allowlisted diagnostics, isolating an unavailable sink', () => {
    const sink = vi.fn(() => {
      throw new Error('unavailable');
    });
    const reporter = createErrorReporter(sink);
    const error = Object.assign(new AppError('server', 'private message'), {
      token: 'private token',
      url: 'private url',
    });
    for (let i = 0; i < 60; i++) reporter.report(error, 'query');
    expect(reporter.snapshot()).toHaveLength(50);
    expect(JSON.stringify(reporter.snapshot())).not.toContain('private');
    expect(Object.keys(reporter.snapshot()[0] ?? {}).sort()).toEqual([
      'kind',
      'source',
      'timestamp',
    ]);
    reporter.report(new OperationCancelledError(), 'query');
    expect(sink).toHaveBeenCalledTimes(60);
  });
  it('cleans up browser listeners', () => {
    const reporter = { report: vi.fn() };
    const target = new EventTarget();
    const stop = observeBrowserErrors(reporter, target);
    target.dispatchEvent(new ErrorEvent('error', { error: new Error('private') }));
    expect(reporter.report).toHaveBeenCalledTimes(1);
    stop();
    target.dispatchEvent(new ErrorEvent('error', { error: new Error('private') }));
    expect(reporter.report).toHaveBeenCalledTimes(1);
  });
  it('updates shared network state and refuses offline writes', () => {
    const status = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const hook = renderHook(() => useOnline());
    expect(hook.result.current).toBe(true);
    status.mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(hook.result.current).toBe(false);
    expect(() => requireOnline()).toThrow(AppError);
    status.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(hook.result.current).toBe(true);
    expect(() => requireOnline()).not.toThrow();
    hook.unmount();
    status.mockRestore();
  });
  it('validates rollout and timezone config while formatters support explicit business settings', () => {
    expect(() => parseEnv({ VITE_TIME_ZONE: 'Invalid/Zone' })).toThrow('VITE_TIME_ZONE');
    expect(() => parseEnv({ VITE_ENABLE_PROJECT_DELETE: 'yes' })).toThrow(
      'VITE_ENABLE_PROJECT_DELETE',
    );
    expect(parseEnv({}).VITE_TIME_ZONE).toBe('UTC');
    expect(formatDateTime('2026-10-01T00:00:00Z', 'en', 'UTC')).toContain('00:00');
    expect(formatDateTime('2026-10-01T00:00:00Z', 'en', 'Asia/Ho_Chi_Minh')).toContain('07:00');
    expect(formatMoney(12, 'en-US', 'USD')).toContain('$12');
    expect(formatMoney(12, 'de-DE', 'EUR')).toContain('€');
  });
});
