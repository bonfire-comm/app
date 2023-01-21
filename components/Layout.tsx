import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  selectorContent?: ReactNode;
  selectorHeader?: ReactNode;
  innerHeader?: ReactNode;
}

export default function Layout({ children, selectorContent = (<section></section>), selectorHeader = (<section></section>), innerHeader = (<section></section>) }: Props) {
  return (
    <main className="grid grid-cols-[4rem_16rem_1fr] h-screen w-screen relative">
      {/* TODO: server selector */}
      <span className="w-16"></span>

      <section className="grid grid-rows-[3rem_1fr_4rem] w-full bg-cloudy-700 bg-opacity-80">
        <section className="shadow w-full h-full">
          {selectorHeader}
        </section>
        {selectorContent}
        {/* TODO: User controller */}
      </section>

      <section className="grid grid-rows-[3rem_1fr] w-full bg-cloudy-600 bg-opacity-80">
        <section className="shadow w-full h-full">
          {innerHeader}
        </section>
        {children}
      </section>
    </main>
  );
}