/** Only the session operations needed by the authenticated HTTP client. */
export interface AuthHttpSession {
  getAccessToken(): string | null;
  getSessionVersion(): number;
  refreshAccessToken(): Promise<string>;
  invalidate(): void;
}
