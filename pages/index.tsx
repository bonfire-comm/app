import Logo from '@/components/Logo';
import Meta from '@/components/Meta';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DetailedHTMLProps, ButtonHTMLAttributes } from 'react';

const GLOBAL_DELAY = 0.5;

function Button({ className = '', ...props }: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`px-6 py-2 rounded-full bg-red-500 hover:-translate-y-1 transition-transform duration-300 ease-in-out text-white font-bold text-lg cursor-pointer ${className}`}
    />
  );
}

function VideoBackground() {
  return (
    <section className="h-screen absolute top-0 left-0 right-0 bottom-0 -z-20">
      <motion.span
        className="w-full h-full absolute top-0 left-0 bg-vantactGray-500 bg-opacity-70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
      <video autoPlay playsInline muted loop className="h-full w-auto object-cover mx-auto">
        <source src="/videos/home.webm" type="video/webm" />
      </video>
    </section>
  );
}

function Nav() {
  return (
    <nav className="px-12 xl:px-32 pt-12 xl:pt-20 flex justify-between items-center z-50">
      <motion.span
        initial={{ opacity: 0, x: -75 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut', delay: GLOBAL_DELAY }}
      >
        <Logo className="w-28 sm:w-32" />
      </motion.span>

      <motion.section
        className="hidden sm:block"
        initial={{ opacity: 0, x: 75 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut', delay: GLOBAL_DELAY }}
      >
        <Link href="/app">
          <Button>Open Bonfire</Button>
        </Link>
      </motion.section>
    </nav>
  );
}

export default function Home() {
  return (
    <>
      <Meta />

      <Nav />

      <motion.section
        className="flex flex-col items-center justify-center w-full h-full absolute top-0 left-0 right-0 bottom-0 -z-[1]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut', delay: GLOBAL_DELAY + 0.2 }}
      >
        <h1 className="font-bigShouldersDisplay font-extrabold text-6xl sm:text-[5.5rem] md:text-8xl mb-2 md:mb-3">A PLACE TO...</h1>

        <motion.p
          className="text-xl sm:text-2xl mb-24"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: 'anticipate', delay: GLOBAL_DELAY + 0.3 }}
        >...hang out, play and relax.</motion.p>

        <motion.span
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: 'anticipate', delay: GLOBAL_DELAY + 0.5 }}
        >
          <Link href="/app">
            <Button>Open in your browser</Button>
          </Link>
        </motion.span>
      </motion.section>

      <VideoBackground />
    </>
  );
}
