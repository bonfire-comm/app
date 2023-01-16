import { ReactNode } from 'react';
import VideoBackground from './VideoBackground';

export default function Layout({ children }: { children: ReactNode}) {
  return (
    <>
      {children}

      <VideoBackground />
    </>
  );
}