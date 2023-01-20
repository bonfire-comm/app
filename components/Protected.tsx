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
  const [id, name] = useUser((s) => [s?.id, s?.name], shallow);
  const isLoaded = useInternal((s) => s.userLoaded);

  useEffect(() => {
    router.prefetch('/login');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!id && router.pathname !== PATHS.login) {
      router.push(PATHS.login);
      return;
    }

    if (!name && router.pathname !== PATHS.onboarding) {
      router.push(PATHS.onboarding);
      return;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isLoaded, name]);

  if (!isLoaded || !id || (!name && router.pathname !== PATHS.onboarding)) return <>{fallback}</>;

  return <>{children}</>;
}