import type { AppThunk, RootState } from '../store/store';
import type { Preferences } from './preferences-schema';
import { preferencesChanged } from './preferences-slice';

// getState is stable per store: separate app instances never share an update queue.
const pendingUpdates = new WeakMap<() => RootState, Promise<void>>();

export const updatePreferences =
  (patch: Partial<Preferences>): AppThunk<Promise<void>> =>
  async (dispatch, getState, dependencies) => {
    const previous = pendingUpdates.get(getState) ?? Promise.resolve();
    const update = previous
      .catch(() => undefined)
      .then(async () => {
        // Read after preceding work settles so concurrent patches cannot overwrite each other.
        const current = getState().preferences;
        const next = { ...current, ...patch };
        if (next.language !== current.language) await dependencies.changeLanguage(next.language);
        dispatch(preferencesChanged(next));
        dependencies.savePreferences(next);
      });
    pendingUpdates.set(getState, update);
    try {
      await update;
    } finally {
      if (pendingUpdates.get(getState) === update) pendingUpdates.delete(getState);
    }
  };
