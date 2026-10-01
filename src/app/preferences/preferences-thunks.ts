import type { AppThunk } from '../store/store';
import type { Preferences } from './preferences-schema';
import { preferencesChanged } from './preferences-slice';

export const updatePreferences =
  (patch: Partial<Preferences>): AppThunk<Promise<void>> =>
  async (dispatch, getState, dependencies) => {
    const next = { ...getState().preferences, ...patch };
    await dependencies.changeLanguage(next.language);
    dispatch(preferencesChanged(next));
    dependencies.savePreferences(next);
  };
