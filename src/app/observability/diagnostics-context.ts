import { createContext } from 'react';
import type { ErrorReporter } from '@/shared/application/ports/error-reporter';
export const DiagnosticsContext = createContext<ErrorReporter | null>(null);
