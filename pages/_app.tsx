import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Big_Shoulders_Display as BigShouldersDisplay, Mulish } from '@next/font/google';

const bigShouldersDisplay = BigShouldersDisplay({
  subsets: ['latin'],
  variable: '--font-big-shoulders-display'
});

const mulish = Mulish({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mulish'
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={[bigShouldersDisplay.variable, mulish.variable, 'font-mulish'].join(' ')}>
      <Component {...pageProps} />
    </main>
  );
}
