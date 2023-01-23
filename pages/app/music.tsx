/* eslint-disable @next/next/no-img-element */
import Layout from '@/components/Layout';
import Meta from '@/components/Meta';
import formatDuration from '@/lib/helpers/formatDuration';
import useMusic, { playlistData } from '@/lib/store/music';
import { faPause, faPauseCircle, faPlay, faPlayCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Slider } from '@mantine/core';
import { shallow } from 'zustand/shallow';

interface ListProps {
  data: PlaylistData;
  index: number;
  currentlyPlaying?: boolean;
}

const SongList = ({ data, index, currentlyPlaying }: ListProps) => {
  const [play, pause, paused, step, skip] = useMusic((state) => [state.play, state.pause, state.paused, state.step, state.skip], shallow);

  return (
    <section
      onClick={() => !currentlyPlaying || paused ? play.call({ step, skip }, index) : pause.call({ step, skip })}
      className={['group cursor-pointer flex items-center gap-4 px-6 py-4 w-full transition-colors duration-100 ease-in-out', currentlyPlaying ? 'bg-cloudy-500 bg-opacity-50' : 'hover:bg-cloudy-600 hover:bg-opacity-70'].join(' ')}
    >
      <section className="relative">
        <span className="group-hover:opacity-100 opacity-0 transition-opacity duration-200 ease-in-out absolute inset-0 w-full h-full grid place-items-center bg-cloudy-600 bg-opacity-40">
          <FontAwesomeIcon
            icon={currentlyPlaying && !paused ? faPause : faPlay}
            color="white"
            size="2x"
          />
        </span>
        <img src={`https://api.dicebear.com/5.x/icons/svg?${data.image}`} alt="icon" className="rounded-md" />
      </section>

      <section>
        <h3 className="font-extrabold text-lg">{data.name}</h3>
        <p>{data.artist}</p>
      </section>
    </section>
  );
};

const Controller = () => {
  const music = useMusic();

  return (
    <section className="bg-cloudy-700 bg-opacity-50 flex flex-col items-center gap-1 justify-center py-2 px-8">
      <section>
        <FontAwesomeIcon
          icon={music.paused || music.currentIndex === null ? faPlayCircle : faPauseCircle}
          className="cursor-pointer"
          size="2x"
          onClick={() => {
            if (music.currentIndex === null) {
              const random = Math.floor(Math.random() * playlistData.length);
              return music.play(random);
            }

            if (music.paused) music.play();
            else music.pause();
          }}
        />
      </section>

      <section className="flex gap-4 w-full items-center justify-center">
        <p className="text-sm font-medium text-cloudy-300">{formatDuration(music.playTime)}</p>
        <Slider
          className="w-full lg:w-2/5"
          classNames={{
            track: 'h-[5px] hover:h-2 transition-all duration-100 ease-in-out bg-cloudy-600',
            thumb: 'hidden'
          }}
          max={1000}
          min={0}
          label={null}
          value={Math.round((music.playTime / music.duration) * 1000)}
          onChange={(v) => {
            const player = music.getCurrentData()?.player;
            if (!player) return;

            player.seek((v / 1000) * player.duration());
          }}
        />
        <p className="text-sm font-medium text-cloudy-300">{formatDuration(music.duration)}</p>
      </section>
    </section>
  );
};

export default function Music() {
  const [getCurrentData, currentIndex] = useMusic((s) => [s.getCurrentData, s.currentIndex], shallow);
  const current = getCurrentData();

  return (
    <>
      <Meta page="Music playlist" />

      <Layout
        innerHeader={
          <section className="px-6 flex items-center h-full w-full">
            <h2 className="font-semibold text-cloudy-50 text-lg">{!current ? 'Nothing is playing' : (<>Now playing - <span className="font-extrabold">{current.name}</span></>)}</h2>
          </section>
        }
      >
        <section className="grid grid-rows-[1fr_6rem]">
          <section className="flex flex-col h-full overflow-y-auto">
            {playlistData.map((p, i) => <SongList key={p.name} data={p} index={i} currentlyPlaying={currentIndex === i} />)}
          </section>

          <Controller />
        </section>
      </Layout>
    </>
  );
}