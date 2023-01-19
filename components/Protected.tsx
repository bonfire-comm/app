import useInternal from '@/lib/store';
import useUser from '@/lib/store/user';
import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';
import { shallow } from 'zustand/shallow';

const PATHS = {
  onboarding: '/onboarding',
  login: '/login'
};

export default function Protected({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const router = useRouter();
  const [uid, name] = useUser((s) => [s.uid, s.displayName], shallow);
  const isLoaded = useInternal((s) => s.userLoaded);

  useEffect(() => {
    router.prefetch('/login');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!uid && router.pathname !== PATHS.login) {
      router.push(PATHS.login);
      return;
    }

    if (!name && router.pathname !== PATHS.onboarding) {
      router.push(PATHS.onboarding);
      return;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, isLoaded, name]);

  if (!isLoaded || !uid || (!name && router.pathname !== PATHS.onboarding)) return <>{fallback}</>;

  return <>{children}</>;
}