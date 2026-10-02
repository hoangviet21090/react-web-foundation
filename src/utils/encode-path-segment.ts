import { AppError } from '@/usecases/app-error';

/** Encode opaque identifiers without allowing URL parsers to collapse dot segments. */
export function encodePathSegment(value: string): string {
  const invalid = () => new AppError('contract', 'Invalid URL path segment.');
  if (
    !value.trim() ||
    value === '.' ||
    value === '..' ||
    [...value].some((character) => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127)
  )
    throw invalid();
  try {
    return encodeURIComponent(value);
  } catch {
    // Unpaired UTF-16 surrogates cannot be URI encoded; don't expose the input in diagnostics.
    throw invalid();
  }
}
