import { PROJECT_STATUSES } from '@/enums/project-status';
import { z } from 'zod';
export const projectResponseSchema = z.object({
  id: z.string().min(1),
  reference: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  budget: z.number().int().positive().max(1_000_000_000),
  currency: z.literal('USD'),
  status: z.enum(PROJECT_STATUSES),
  createdAt: z.iso.datetime(),
  version: z.number().int().positive(),
});
export const projectListResponseSchema = z.object({
  items: z.array(projectResponseSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export const deleteProjectResponseSchema = z.object({ deleted: z.literal(true) });
