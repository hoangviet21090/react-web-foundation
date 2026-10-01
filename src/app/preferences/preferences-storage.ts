import { preferencesSchema } from './preferences-schema';
import type { Preferences } from './preferences-schema';

export function createPreferencesStorage(storage: Pick<Storage, 'getItem' | 'setItem'>) {
  const key = 'web-foundation:preferences:v1';
  return {
    load(fallback: Preferences): Preferences {
      try {
        const parsed = preferencesSchema.safeParse(JSON.parse(storage.getItem(key) ?? 'null'));
        return parsed.success ? parsed.data : fallback;
      } catch {
        return fallback;
      }
    },
    save(value: Preferences) {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch {
        /* Private browsing/quota: preferences stay in memory. */
      }
    },
  };
}
