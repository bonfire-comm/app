import Twemoji from './Twemoji';

export default function EmptyPlaceholder() {
  return (
    <section className="absolute inset-0 opacity-20 flex items-center justify-center flex-col h-full">
      <Twemoji className="text-7xl mb-3 animate-pulse">👻</Twemoji>
      <p className="text-lg font-medium">Nothing to see here...</p>
    </section>
  );
}