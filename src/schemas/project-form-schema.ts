import { PROJECT_STATUSES } from '@/enums/project-status';
import { z } from 'zod';
export const projectFormSchema = z.object({
  name: z.string().trim().min(2, 'validation.name').max(100, 'validation.name'),
  budget: z
    .number({ error: 'validation.budget' })
    .int('validation.budget')
    .positive('validation.budget')
    .max(1_000_000_000, 'validation.budget'),
  status: z.enum(PROJECT_STATUSES),
});
export type ProjectFormValues = z.infer<typeof projectFormSchema>;
