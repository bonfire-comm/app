import useInternal from '@/lib/store';
import useUser from '@/lib/store/user';
import { useRouter } from 'next/router';
import { ReactNode, useEffect } from 'react';

export default function Protected({ children }: { children: ReactNode }) {
  const router = useRouter();
  const uid = useUser((s) => s.uid);
  const isLoaded = useInternal((s) => s.userLoaded);

  useEffect(() => {
    if (!uid && isLoaded) {
      router.push('/login');
    }
  }, [uid, isLoaded, router]);

  if (!isLoaded || !uid) return null;


  return <>{children}</>;
}