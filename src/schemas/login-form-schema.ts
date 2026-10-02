import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  password: z.string().min(1).max(128),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;
