export const PROJECT_STATUSES = ['draft', 'active', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
