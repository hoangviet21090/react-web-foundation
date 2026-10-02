import { z } from 'zod';

export const preferencesSchema = z.object({
  language: z.enum(['vi', 'en']),
  theme: z.enum(['light', 'dark']),
});
export type Preferences = z.infer<typeof preferencesSchema>;
