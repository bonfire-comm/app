import { Participant } from '@videosdk.live/js-sdk/participant';
import { useAsync } from 'react-use';
import firebaseClient from '@/lib/firebase';
import useUser from '@/lib/store/user';
import { useEffect, useMemo, useRef } from 'react';

interface PresenterPreviewProps {
  participant: Participant;
}

const PresenterPreview = ({ participant }: PresenterPreviewProps) => {
  const user = useAsync(() => firebaseClient.managers.user.fetch(participant.id), [participant]);
  const currentUser = useUser((s) => s?.id);
  // eslint-disable-next-line no-shadow

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const videoStream = [...participant.streams.values()].find((s) => s.kind === 'share');
  const audioStream = [...participant.streams.values()].find((s) => s.kind === 'shareAudio');

  const videoMediaStream = useMemo(() => {
    if (videoStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(videoStream.track);

      return mediaStream;
    }
  }, [videoStream]);

  useEffect(() => {
    if (videoRef.current && videoMediaStream) {
      videoRef.current.srcObject = videoMediaStream;

      videoRef.current.onloadedmetadata = () => {
        // eslint-disable-next-line no-console, @typescript-eslint/no-non-null-assertion
        videoRef.current!.play().catch((e) => console.error('failed to init playback', e));
      };
    }
  }, [videoMediaStream, videoRef]);

  useEffect(() => {
    if (audioRef.current && !participant.local) {
      if (audioStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(audioStream.track);

        audioRef.current.srcObject = mediaStream;
        // eslint-disable-next-line no-console
        audioRef.current.play().catch((e) => console.error('failed to init playback', e));
      } else {
        audioRef.current.srcObject = null;
      }
    }
  }, [audioStream, audioRef, participant]);

  return (
    <section className="group overflow-hidden relative aspect-video w-full bg-cloudy-700 rounded-lg grid place-items-center drop-shadow-md border-2 border-cloudy-500">
      <section className="absolute bottom-2 left-2 bg-zinc-800 bg-opacity-75 px-2 rounded-md">
        <p>{participant.id !== currentUser ? user.value?.name : 'You are presenting'}</p>
      </section>

      <video muted playsInline autoPlay className={`${!videoMediaStream ? 'hidden' : 'aspect-video w-full'}`} ref={videoRef} />
      <audio className="hidden" autoPlay playsInline controls={false} ref={audioRef} />;
    </section>
  );
};

export default PresenterPreview;