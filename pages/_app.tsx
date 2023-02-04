import '../styles/globals.css';
import '@/lib/firebase';

import type { AppProps } from 'next/app';
import { Big_Shoulders_Display as BigShouldersDisplay, Mulish } from '@next/font/google';
import { MantineProvider, Portal, createEmotionCache } from '@mantine/core';
import VideoBackground from '@/components/VideoBackground';
import { AnimatePresence } from 'framer-motion';
import useInternal from '@/lib/store';
import { NotificationsProvider } from '@mantine/notifications';
import { useEffect } from 'react';
import TokenCookieProvider from '@/components/TokenCookieProvider';
import { ModalsProvider } from '@mantine/modals';
import useVoice from '@/lib/store/voice';
import { MeetingVoicePlayer } from '@/components/VoicePlayer';

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

    (async () => {
      if (typeof window === 'undefined') return;

      const { VideoSDK } = await import('@videosdk.live/js-sdk');
      useVoice.setState({
        SDK: VideoSDK
      });
    })();
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
          MultiSelect: {
            classNames: {
              input: 'border-none rounded-xl h-auto py-2 px-3 font-medium',
              defaultValue: 'rounded-xl'
            }
          },
          Button: {
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
          },
          Modal: {
            classNames: {
              title: 'font-extrabold text-xl'
            }
          },
          InputWrapper: {
            classNames: {
              label: 'font-extrabold text-cloudy-300 mb-1 block'
            }
          }
        }
      }}
    >
      <NotificationsProvider
        zIndex={99999999}
      >
        <ModalsProvider>
          <TokenCookieProvider>
            <Portal>
              <MeetingVoicePlayer />
            </Portal>

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
        </ModalsProvider>
      </NotificationsProvider>
    </MantineProvider>
  );
}
