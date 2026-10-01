import { z } from 'zod';
export const projectDtoSchema = z.object({
  id: z.string().min(1),
  reference: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  budget: z.number().int().positive().max(1_000_000_000),
  currency: z.literal('USD'),
  status: z.enum(['draft', 'active', 'archived']),
  createdAt: z.iso.datetime(),
  version: z.number().int().positive(),
});
export const projectListDtoSchema = z.object({
  items: z.array(projectDtoSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export const deleteProjectDtoSchema = z.object({ deleted: z.literal(true) });
export type ProjectDto = z.infer<typeof projectDtoSchema>;
