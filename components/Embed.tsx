/* eslint-disable @next/next/no-img-element */
import { ReactNode } from 'react';
import YouTube from 'react-youtube';

const YOUTUBE_ID_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

export const EmbedMediaPreview = ({ data }: { data: EmbedData}) => {
  const Container = ({ children }: { children: ReactNode }) => <section className="mt-2 rounded-lg overflow-hidden">{children}</section>;

  if (!data.publisher && !data.image && !data.audio) return null;

  return (
    <Container>
      {(() => {
        const matched = data.url?.match(YOUTUBE_ID_REGEX);
        const id = matched && matched[2];
        if (!id) return null;

        return (
          <Container>
            <YouTube videoId={id} className="w-full" iframeClassName="w-full h-64 object-fit" />
          </Container>
        );
      })()}

      {!!data.image && (
        <img src={data.image} alt="" />
      )}

      {!!data.audio && (
        <audio controls src={data.audio} />
      )}
    </Container>
  );
};

export default function Embed({ data }: { data: EmbedData }) {
  return (
    (
      <section
        className="embed overflow-hidden min-w-[8rem] max-w-lg rounded-xl px-6 py-4 bg-cloudy-500 bg-opacity-80 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:z-10 before:w-[6px]"
        style={{
          // @ts-expect-error --before-color is not a valid css property
          '--before-color': data.color ?? '#FFFFFF',
        }}
      >
        <section className="flex justify-between gap-4 items-start">
          <section>
            {data.title && (
              <h2 className="font-extrabold text-lg">
                {!data.url && data.title}
                {data.url && (
                  <a className="hover:underline hover:underline-offset-1" href={data.url} rel="noreferrer" target="_blank">{data.title}</a>
                )}
              </h2>
            )}
            {data.description && <p>{data.description}</p>}
          </section>

          {data.logo && <img className="w-8 h-auto rounded-md" src={data.logo} alt="" />}
        </section>

        <EmbedMediaPreview data={data} />
      </section>
    )
  );
}