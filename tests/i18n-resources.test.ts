import { describe, expect, it } from 'vitest';
import viLocale from '@/shared/infrastructure/i18n/locales/vi.json';
import enLocale from '@/shared/infrastructure/i18n/locales/en.json';

function textResources(resource: unknown, path = ''): Map<string, string> {
  if (typeof resource === 'string') return new Map([[path, resource]]);
  if (!resource || typeof resource !== 'object' || Array.isArray(resource)) {
    throw new Error('Locale resource must be an object or text: ' + path);
  }
  const leaves = new Map<string, string>();
  for (const [key, value] of Object.entries(resource)) {
    for (const [leaf, text] of textResources(value, path ? path + '.' + key : key)) {
      leaves.set(leaf, text);
    }
  }
  return leaves;
}

function interpolationArguments(text: string) {
  const variables = [...text.matchAll(/\{\{\s*-?\s*([A-Za-z0-9_.]+)(?:\s*,[^}]*)?\s*\}\}/g)].map(
    (match) => match[1],
  );
  return [...new Set(variables)].sort();
}

describe('Bundled locale resource contracts', () => {
  it('keeps the complete nested string-key shape identical across supported languages', () => {
    const vi = textResources(viLocale);
    const en = textResources(enLocale);
    expect([...en.keys()].sort()).toEqual([...vi.keys()].sort());
  });

  it('requires each translation to accept the same interpolation arguments', () => {
    const vi = textResources(viLocale);
    const en = textResources(enLocale);
    for (const [key, value] of vi) {
      expect(interpolationArguments(en.get(key) ?? ''), key).toEqual(interpolationArguments(value));
    }
  });
});
