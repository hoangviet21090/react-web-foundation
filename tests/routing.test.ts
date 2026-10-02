import { describe, expect, it } from 'vitest';
import { matchRoutes } from 'react-router';
import { createAppRoutes } from '@/routes/router';
import { APP_ROUTES, projectsHref } from '@/constants/routes';
import { safeReturnTo } from '@/routes/return-to';
import { parseProjectListSearch, updateProjectListSearch } from '@/routes/project-list-search';

describe('Browser URL boundaries', () => {
  it.each(['0', '-1', '1.5', '1e2', '0x10', 'Infinity', 'NaN', '9007199254740992', '02', ''])(
    'normalizes invalid page %s before constructing a request/cache key',
    (page) => {
      expect(parseProjectListSearch(new URLSearchParams({ page, search: '  An  ' }))).toEqual({
        page: 1,
        search: 'An',
      });
    },
  );
  it('round trips search values without treating reserved characters as query parameters', () => {
    const search = 'Nguyễn & + # ? / =';
    const href = projectsHref({ page: 3, search });
    const url = new URL(href, 'https://app.invalid');
    expect(url.pathname).toBe('/projects');
    expect([...url.searchParams.keys()].sort()).toEqual(['page', 'search']);
    expect(parseProjectListSearch(url.searchParams)).toEqual({ page: 3, search });
    expect(matchRoutes(createAppRoutes(), href)?.at(-1)?.route.id).toBe(APP_ROUTES.projects.id);
  });
  it('resets the page on search, retains unrelated URL values and never mutates router state', () => {
    const current = new URLSearchParams('page=3&search=Old&tab=active&tag=a&tag=b');
    const next = updateProjectListSearch(current, { search: '  New & name  ' });
    expect(next.get('page')).toBeNull();
    expect(next.get('search')).toBe('New & name');
    expect(next.get('tab')).toBe('active');
    expect(next.getAll('tag')).toEqual(['a', 'b']);
    expect(current.get('page')).toBe('3');
    expect(current.get('search')).toBe('Old');
    const cleared = updateProjectListSearch(next, { search: '' });
    expect(cleared.toString()).toBe('tab=active&tag=a&tag=b');
  });
  it('pagination preserves filters and encodes canonical defaults once', () => {
    const next = updateProjectListSearch(new URLSearchParams('search=An&tab=active'), { page: 2 });
    expect(parseProjectListSearch(next)).toEqual({ page: 2, search: 'An' });
    expect(next.get('tab')).toBe('active');
    expect(projectsHref({ page: 1, search: ' ' })).toBe(APP_ROUTES.projects.path);
  });
  it.each([
    '/LOGIN/',
    '/login/?from=projects',
    '/%6Cogin',
    '/foo/../login',
    '/%2Foutside.test',
    '/%5Coutside.test',
    '/%0Aprojects',
    '/%7Fprojects',
    '/%E0%A4',
  ])('rejects redirect loops and malformed/unsafe paths: %s', (returnTo) => {
    expect(safeReturnTo({ returnTo })).toBe(APP_ROUTES.projects.path);
  });
  it('keeps an authenticated deep link with query/hash and matches its registered route', () => {
    const target = safeReturnTo({ returnTo: APP_ROUTES.newProject.path + '?from=list#form' });
    expect(target).toBe('/projects/new?from=list#form');
    expect(matchRoutes(createAppRoutes(), target)?.at(-1)?.route.id).toBe(APP_ROUTES.newProject.id);
  });
});
