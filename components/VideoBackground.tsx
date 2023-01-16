'use client';

import { motion } from 'framer-motion';

export const GLOBAL_DELAY = 0.5;

export default function VideoBackground() {
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