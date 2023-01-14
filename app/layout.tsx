import '@/styles/globals.css';
import { Big_Shoulders_Display as BigShouldersDisplay, Mulish } from '@next/font/google';

const bigShouldersDisplay = BigShouldersDisplay({
  subsets: ['latin'],
  variable: '--font-big-shoulders-display'
});

const mulish = Mulish({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mulish'
});

export default function RootLayout({ children }: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={[bigShouldersDisplay.variable, mulish.variable].join(' ')}>
      <body>{children}</body>
    </html>
  );
}