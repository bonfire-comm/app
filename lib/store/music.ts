import { create } from 'zustand';
import { Howl }from 'howler';
import { combine } from 'zustand/middleware';
import fisherYatesShuffle from '../helpers/fisherYatesShuffle';

export const playlistData: PlaylistData[] = [
  {
    name: 'Acoustic Guitar Looping',
    file: '/audio/I4sVGrn3-gM.webm',
    artist: 'Hvetter',
    link: 'https://www.youtube.com/watch?v=I4sVGrn3-gM',
    image: 'seed=13315&size=64&backgroundColor=ffd5dc'
  },
  {
    name: 'Loop 4',
    file: '/audio/oeY-mL7O6CA.webm',
    artist: 'Foam',
    link: 'https://www.youtube.com/watch?v=oeY-mL7O6CA',
    image: 'seed=13245&size=64&backgroundColor=c0aede'
  },
  {
    name: 'Waves',
    file: '/audio/x03r4Hn8trk.webm',
    artist: 'Oak Studios',
    link: 'https://www.youtube.com/watch?v=x03r4Hn8trk',
    image: 'seed=35155&size=64&backgroundColor=b6e3f4,ffdfbf'
  },
  {
    name: 'Chill Guitar x R&B Soul x Boom Bap Type Beat',
    file: '/audio/6382Bwe1_Rw.webm',
    artist: 'Cristian Vera Music',
    link: 'https://www.youtube.com/watch?v=6382Bwe1_Rw',
    image: 'seed=12553&size=64&backgroundColor=d1d4f9'
  },
  {
    name: 'Crush',
    file: '/audio/8RpK-E0IZ2w.webm',
    artist: 'Chillin\'K Music',
    link: 'https://www.youtube.com/watch?v=8RpK-E0IZ2w',
    image: 'seed=31563&size=64&backgroundColor=b6e3f4,ffd5dc'
  },
  {
    name: 'Flower',
    file: '/audio/SRun6bKioEQ.webm',
    artist: 'Luxøfons',
    link: 'https://www.youtube.com/watch?v=SRun6bKioEQ',
    image: 'seed=26424&size=64&backgroundColor=ffd5dc,ffdfbf'
  },
];

const useMusic = create(
  combine({
    currentIndex: null as number | null,
    volume: 0.5,
    paused: false as boolean,
    playTime: 0,
    shuffle: false as boolean,
    loop: false as boolean,
    ended: false as boolean,
    duration: 0,
    indexMap: null as Map<number, number> | null
  }, (set, get) => ({
    setShuffle: (s: boolean) => {
      const data = {
        shuffle: s,
        indexMap: null as Map<number, number> | null
      };

      if (s) {
        data.indexMap = new Map<number, number>(Object.entries(fisherYatesShuffle(Object.keys(playlistData).map((key) => parseInt(key, 10)))).map(([key, value]) => [parseInt(key, 10), value]));
      }

      set(data);
    },
    setLoop: (loop: boolean) => {
      set({ loop });
    },
    generateShuffledIndexMap() {
      set({
        indexMap: new Map<number, number>(Object.entries(fisherYatesShuffle(Object.keys(playlistData).map((key) => parseInt(key, 10)))).map(([key, value]) => [parseInt(key, 10), value]))
      });
    },
    getCurrentData() {
      const { currentIndex } = get();
      if (currentIndex === null) return null;

      return playlistData[currentIndex] ?? null;
    },
    setVolume: (volume: number) => {
      const { currentIndex } = get();
      if (currentIndex !== null) {
        playlistData[currentIndex]?.player?.volume(volume);
      }

      set({ volume });
    },
    play(index?: number) {
      if (index === undefined) {
        const { playTime } = get();
        const data = this.getCurrentData();
        if (!data) return;

        data.player?.seek(playTime);
        data.player?.play();
        return set({ paused: false });
      }

      const data = playlistData[index];
      if (!data) return;

      const { currentIndex, paused, playTime } = get();
      if (currentIndex !== null) {
        playlistData[currentIndex]?.player?.stop();
      }

      const player = data.player ?? new Howl({
        src: data.file,
        html5: true,
        volume: get().volume,
      });

      if (!data.player) {
        playlistData[index].player = player;
        player.once('end', () => {
          set({ ended: true });

          const currentData = get();

          if (currentData.loop) return this.play(index);
          if (currentData.shuffle) {
            const nextIndex = currentData.indexMap?.get(index) as number;
            return this.play(nextIndex);
          }

          this.next();
        });
        player.once('load', () => set({ duration: player.duration() }));
      }

      if (index === currentIndex && paused) {
        player.seek(playTime);
        set({ paused: false });
      } else {
        set({ currentIndex: index, paused: false, playTime: 0, ended: false });
      }

      player.play();
      if (!paused) this.step();
    },
    pause() {
      const { currentIndex } = get();
      if (currentIndex === null) return;

      playlistData[currentIndex]?.player?.pause();
      set({ paused: true });
    },
    next() {
      const { currentIndex, shuffle } = get();
      if (currentIndex === null) return;

      if (shuffle) {
        const nextIndex = get().indexMap?.get(currentIndex) as number;
        this.play(nextIndex);
        set({ currentIndex: nextIndex });
        return;
      }

      const nextIndex = playlistData[currentIndex + 1] ? currentIndex + 1 : 0;

      this.play(nextIndex);
      set({ currentIndex: nextIndex });
    },
    prev() {
      const { currentIndex, shuffle } = get();
      if (currentIndex === null) return;

      if (shuffle) {
        const indexMap = get()?.indexMap;
        if (!indexMap) return;

        const reversed = new Map<number, number>([...indexMap.entries()].map(([key, value]) => [value, key]));
        const prevIndex = reversed.get(currentIndex) as number;
        this.play(prevIndex);
        set({ currentIndex: prevIndex });
        return;
      }

      const prevIndex = playlistData[currentIndex - 1] ? currentIndex - 1 : playlistData.length - 1;

      this.play(prevIndex);
      set({ currentIndex: prevIndex });
    },
    step() {
      const { currentIndex, ended } = get();
      if (currentIndex === null) return;

      const player = playlistData[currentIndex]?.player;
      if (!player) return;

      const time = player.seek() || 0;
      set({ playTime: time });

      if (!ended) {
        // 10 fps
        setTimeout(() => this.step(), 1000 / 10);
      }
    }
  }))
);

useMusic.subscribe((state) => {
  localStorage.setItem('shuffle', JSON.stringify(state.shuffle));
  localStorage.setItem('loop', JSON.stringify(state.loop));
  localStorage.setItem('volume', JSON.stringify(state.volume));
});

export default useMusic;