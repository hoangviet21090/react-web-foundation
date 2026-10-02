import { describe, expect, it } from 'vitest';
import { projectHref, editProjectHref } from '@/constants/routes';
import { PROJECT_ENDPOINTS } from '@/constants/endpoints';

describe('Resource identifiers in URLs', () => {
  it.each(['', ' ', '.', '..', 'id\nvalue', String.fromCharCode(0xd800)])(
    'rejects nonrepresentable path identifiers before navigation or HTTP (%j)',
    (id) => {
      for (const builder of [projectHref, editProjectHref, PROJECT_ENDPOINTS.detail]) {
        expect(() => builder(id)).toThrow('Invalid URL path segment.');
      }
    },
  );
  it.each(['project-1', 'a/b?c#d%', 'Nguyễn An', '%2e%2e'])(
    'preserves an encoded opaque identifier and the route prefix (%s)',
    (id) => {
      const encoded = encodeURIComponent(id);
      const detail = new URL(projectHref(id), 'https://example.test');
      const edit = new URL(editProjectHref(id), 'https://example.test');
      expect(detail.pathname).toBe('/projects/' + encoded);
      expect(edit.pathname).toBe('/projects/' + encoded + '/edit');
      expect(detail.search + detail.hash).toBe('');
      expect(decodeURIComponent(detail.pathname.slice('/projects/'.length))).toBe(id);
      expect(PROJECT_ENDPOINTS.detail(id)).toBe('/projects/' + encoded);
    },
  );
});
