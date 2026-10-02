import { PROJECT_STATUSES } from '@/enums/project-status';
import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';
import type { Project } from '@/entities/project';
import { success, failure } from '@/mocks/response';
import { mockUrl } from '@/mocks/api-url';
import { authHandlers, authorizeMock } from '@/mocks/auth-handlers';
import { createProjectFixtures } from '@/mocks/fixtures';

let projects = createProjectFixtures();
let sequence = projects.length;
export function resetMockDatabase() {
  projects = createProjectFixtures();
  sequence = projects.length;
}
export const mockApiUrl = mockUrl('/projects');
const bodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  budget: z.number().int().positive().max(1_000_000_000),
});
const updateSchema = bodySchema.extend({ status: z.enum(PROJECT_STATUSES) });
const querySchema = z.object({
  page: z.coerce.number().int().min(1),
  pageSize: z.coerce.number().int().min(1).max(100),
  search: z.string().trim().max(200),
});
const missing = () =>
  HttpResponse.json(failure('Project not found.', 'NOT_FOUND'), { status: 404 });
const conflict = () =>
  HttpResponse.json(failure('Version conflict.', 'VERSION_CONFLICT'), { status: 412 });
async function requestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
export const handlers = [
  ...authHandlers,
  http.get(mockApiUrl, async ({ request }) => {
    const denied = authorizeMock(request, 'projects:read');
    if (denied) return denied;
    await delay(import.meta.env.MODE === 'test' ? 0 : 180);
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: url.searchParams.get('page') ?? 1,
      pageSize: url.searchParams.get('pageSize') ?? 5,
      search: url.searchParams.get('search') ?? '',
    });
    if (!parsed.success)
      return HttpResponse.json(failure('Invalid query.', 'VALIDATION'), { status: 400 });
    const { page, pageSize } = parsed.data;
    const search = parsed.data.search.toLocaleLowerCase();
    const filtered = projects.filter((project) =>
      (project.name + ' ' + project.reference).toLocaleLowerCase().includes(search),
    );
    return HttpResponse.json(
      success({
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        totalCount: filtered.length,
        page,
        pageSize,
      }),
    );
  }),
  http.get(mockApiUrl + '/:id', ({ request, params }) => {
    const denied = authorizeMock(request, 'projects:read');
    if (denied) return denied;
    const project = projects.find((item) => item.id === params.id);
    return project ? HttpResponse.json(success(project)) : missing();
  }),
  http.post(mockApiUrl, async ({ request }) => {
    const denied = authorizeMock(request, 'projects:create');
    if (denied) return denied;
    await delay(import.meta.env.MODE === 'test' ? 0 : 250);
    const parsed = bodySchema.safeParse(await requestBody(request));
    if (!parsed.success)
      return HttpResponse.json(failure('Invalid project.', 'VALIDATION'), { status: 400 });
    const project: Project = {
      ...parsed.data,
      id: crypto.randomUUID(),
      reference: 'PRJ-DEMO-' + String(++sequence).padStart(3, '0'),
      currency: 'USD',
      status: 'draft',
      createdAt: new Date().toISOString(),
      version: 1,
    };
    projects = [project, ...projects];
    return HttpResponse.json(success(project), { status: 201 });
  }),
  http.put(mockApiUrl + '/:id', async ({ request, params }) => {
    const denied = authorizeMock(request, 'projects:update');
    if (denied) return denied;
    const parsed = updateSchema.safeParse(await requestBody(request));
    if (!parsed.success)
      return HttpResponse.json(failure('Invalid project.', 'VALIDATION'), { status: 400 });
    // Re-read after await so concurrent writes cannot both use the same old version.
    const index = projects.findIndex((item) => item.id === params.id);
    const existing = projects[index];
    if (!existing) return missing();
    if (request.headers.get('If-Match') !== '"' + existing.version + '"') return conflict();
    const project: Project = { ...existing, ...parsed.data, version: existing.version + 1 };
    projects[index] = project;
    return HttpResponse.json(success(project));
  }),
  http.delete(mockApiUrl + '/:id', ({ request, params }) => {
    const denied = authorizeMock(request, 'projects:delete');
    if (denied) return denied;
    const project = projects.find((item) => item.id === params.id);
    if (!project) return missing();
    if (request.headers.get('If-Match') !== '"' + project.version + '"') return conflict();
    projects = projects.filter((item) => item.id !== project.id);
    return HttpResponse.json(success({ deleted: true }));
  }),
];
