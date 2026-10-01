/** Structural port supplied by the composition root; no dependency on an auth feature. */
export interface AuthHttpSession {
  getAccessToken(): string | null;
  getSessionVersion(): number;
  refreshAccessToken(): Promise<string>;
  invalidate(): void;
}
