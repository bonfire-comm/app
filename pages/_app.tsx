import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Big_Shoulders_Display as BigShouldersDisplay, Mulish } from '@next/font/google';
import { MantineProvider, createEmotionCache } from '@mantine/core';

const bigShouldersDisplay = BigShouldersDisplay({
  subsets: ['latin'],
  variable: '--font-big-shoulders-display'
});

const mulish = Mulish({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mulish'
});

const cache = createEmotionCache({
  key: 'mantine',
  prepend: false
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider
      withGlobalStyles
      withCSSVariables
      emotionCache={cache}
      theme={{
        fontFamily: 'Mulish, sans-serif',
        colorScheme: 'dark',
        colors: {
          dark: [
            // '#f4f5f6',
            '#ccd0d5',
            '#a4abb4',
            '#7c8693',
            '#536171',
            '#293a50',
            '#233141',
            '#1b2532',
            '#121a22',
            '#0a0e13',
            '#020304'
          ]
        },
        components: {
          TextInput: {
            classNames: {
              label: 'font-extrabold text-cloudy-300'
            }
          }
        }
      }}
    >
      <main className={[bigShouldersDisplay.variable, mulish.variable].join(' ')}>
        <Component {...pageProps} />
      </main>
    </MantineProvider>
  );
}
