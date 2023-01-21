import '../styles/globals.css';
import '@/lib/firebase';

import type { AppProps } from 'next/app';
import { Big_Shoulders_Display as BigShouldersDisplay, Mulish } from '@next/font/google';
import { MantineProvider, createEmotionCache } from '@mantine/core';
import VideoBackground from '@/components/VideoBackground';
import { AnimatePresence } from 'framer-motion';
import useInternal from '@/lib/store';
import { NotificationsProvider } from '@mantine/notifications';
import { useEffect } from 'react';
import TokenCookieProvider from '@/components/TokenCookieProvider';

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

export default function App({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    document.body.classList.add(bigShouldersDisplay.variable, mulish.variable);
  }, []);

  return (
    <MantineProvider
      withGlobalStyles
      withCSSVariables
      emotionCache={cache}
      theme={{
        fontFamily: 'var(--font-mulish)',
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
              label: 'font-extrabold text-cloudy-300 mb-1 block',
              input: 'border-none rounded-xl h-auto py-2 px-5 font-medium'
            }
          },
          Button: {
            classNames: {
              root: 'disabled:opacity-50 pointer-events-auto disabled:cursor-not-allowed rounded-xl font-extrabold text-lg h-auto py-4 text-cloudy-600 bg-light-blue-500 hover:bg-light-blue-600 transition-colors duration-200 ease-in-out'
            },
            defaultProps: {
              loaderProps: {
                color: 'blue'
              }
            }
          },
          Notification: {
            classNames: {
              title: 'font-bold',
            }
          },
          Tabs: {
            classNames: {
              tab: 'px-2 font-semibold py-2 data-[active=true]:bg-cloudy-500 transition-color duration-200 ease-in-out',
              tabsList: 'gap-3'
            }
          }
        }
      }}
    >
      <NotificationsProvider
        zIndex={99999999}
      >
        <TokenCookieProvider>
          <AnimatePresence
            mode="wait"
            onExitComplete={() => {
              if (useInternal.getState().initialDelay !== 0) {
                useInternal.setState({ initialDelay: 0 });
              }
            }}
          >
            <Component {...pageProps} key={router.asPath} />
          </AnimatePresence>

          <VideoBackground />
        </TokenCookieProvider>
      </NotificationsProvider>
    </MantineProvider>
  );
}
