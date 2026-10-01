import { z } from 'zod';
export const authCredentialsDtoSchema = z.object({
  accessToken: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.email(),
    permissions: z.array(
      z.custom<`${string}:${string}`>(
        (value) => typeof value === 'string' && /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/.test(value),
      ),
    ),
  }),
});
export const logoutResultDtoSchema = z.object({ loggedOut: z.literal(true) });

export type AuthCredentialsDto = z.infer<typeof authCredentialsDtoSchema>;
