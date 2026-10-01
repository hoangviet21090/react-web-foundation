/** Business invariant failure. No transport or platform metadata. */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind: 'validation' | 'business' = 'validation',
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
