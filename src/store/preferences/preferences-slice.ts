import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { Preferences } from '@/store/preferences/preferences-schema';

const initialState: Preferences = { language: 'vi', theme: 'light' };
const slice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    preferencesChanged: (_state, action: PayloadAction<Preferences>) => action.payload,
  },
});
export const { preferencesChanged } = slice.actions;
export const preferencesReducer = slice.reducer;
