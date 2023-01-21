import { DetailedHTMLProps, HTMLAttributes, ReactElement, useMemo } from 'react';
import renderEmoji from 'react-easy-emoji';

export function Emoji({ code, emoji }: { code: string; emoji?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://twemoji.maxcdn.com/2/svg/${code}.svg`} alt={emoji} className="h-[1em] inline-block my-0 mx-[.2em] align-[-0.1em]" />;
}

export default function Twemoji({ children, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>) {
  const rendered = useMemo(() =>
    renderEmoji(children, (code, emoji, key) => (<Emoji code={code} emoji={emoji} key={key} />)) as unknown as (ReactElement | string)[],
  [children]
  );

  return (
    <p {...props}>
      {rendered.map((value, i) => typeof value === 'string' ? <span key={i} className="break-words whitespace-pre-line">{value}</span> : value)}
    </p>
  );
}