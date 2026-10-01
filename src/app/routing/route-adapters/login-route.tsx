import { LoginPage } from '@/features/auth/presentation/pages/login-page';
import { env } from '@/shared/infrastructure/config/env';
import { GuestOnly } from '../guards/route-guards';
import { AppearanceControls } from '../../preferences/appearance-controls';
export function LoginRoute() {
  return (
    <GuestOnly>
      <header className="flex items-center justify-end gap-3 border-b p-4">
        <AppearanceControls />
      </header>
      <LoginPage
        demoMode={
          (import.meta.env.MODE === 'mock' || import.meta.env.MODE === 'demo') &&
          env.VITE_ENABLE_MOCKS === 'true'
        }
      />
    </GuestOnly>
  );
}
