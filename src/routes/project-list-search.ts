import type { ProjectListLocation } from '@/types/project-list-location';

function validPage(value: number): number {
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}
export function parseProjectListSearch(params: URLSearchParams): ProjectListLocation {
  const rawPage = params.get('page') ?? '';
  return {
    page: /^[1-9]\d*$/.test(rawPage) ? validPage(Number(rawPage)) : 1,
    search: (params.get('search') ?? '').trim(),
  };
}
export function updateProjectListSearch(
  current: URLSearchParams,
  patch: Partial<ProjectListLocation>,
): URLSearchParams {
  const previous = parseProjectListSearch(current);
  const page = validPage(patch.page ?? (patch.search === undefined ? previous.page : 1));
  const search = (patch.search ?? previous.search).trim();
  // Clone: React Router owns the current searchParams object. Preserve unrelated query keys.
  const next = new URLSearchParams(current);
  if (page === 1) next.delete('page');
  else next.set('page', String(page));
  if (search) next.set('search', search);
  else next.delete('search');
  return next;
}
