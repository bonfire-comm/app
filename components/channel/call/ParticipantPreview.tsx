import { Participant } from '@videosdk.live/js-sdk/participant';
import { useAsync } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEarDeaf, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import firebaseClient from '@/lib/firebase';
import useUser from '@/lib/store/user';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import useVoice from '@/lib/store/voice';
import { shallow } from 'zustand/shallow';
import { useForceUpdate } from '@mantine/hooks';

interface ParticipantPreviewProps {
  participant: Participant;
  active?: boolean;
  deafened?: boolean;
}

const ParticipantPreview = ({ participant, active, deafened = false }: ParticipantPreviewProps) => {
  const forceRender = useForceUpdate();
  const user = useAsync(() => firebaseClient.managers.user.fetch(participant.id), [participant]);
  const currentUser = useUser((s) => s?.id);
  // eslint-disable-next-line no-shadow
  const [muted, video] = useVoice(({ muted, video }) => [muted, video], shallow);

  const webcamOn = currentUser !== undefined && user.value?.id === currentUser ? video : participant.webcamOn;
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const webcamStream = [...participant.streams.values()].find((s) => s.kind === 'video');

  const webcamMediaStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);

      return mediaStream;
    }
  }, [webcamOn, webcamStream]);

  useLayoutEffect(() => {
    if (webcamVideoRef.current && webcamMediaStream) {
      webcamVideoRef.current.srcObject = webcamMediaStream;

      webcamVideoRef.current.onloadedmetadata = () => {
        // eslint-disable-next-line no-console, @typescript-eslint/no-non-null-assertion
        webcamVideoRef.current!.play().catch((e) => console.error('failed to init playback', e));
      };
    }
  }, [webcamMediaStream, webcamVideoRef]);

  useEffect(() => {
    const updateHandler = () => {
      forceRender();
    };

    participant.on('stream-enabled', updateHandler);
    participant.on('stream-disabled', updateHandler);

    return () => {
      participant.off('stream-enabled', updateHandler);
      participant.off('stream-disabled', updateHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant]);

  return (
    <section className={`group overflow-hidden relative aspect-video max-w-[28rem] min-w-[28rem] bg-cloudy-700 rounded-lg ${!active ? 'border-[3px] border-cloudy-700' : 'border-[3px] border-green-500'} transition-all duration-100 ease-in-out grid place-items-center`}>
      <section className="group-hover:opacity-100 opacity-0 transition-opacity duration-150 ease-in-out absolute bottom-2 left-2 bg-zinc-800 bg-opacity-75 px-2 rounded-md">
        <p>{user.value?.name}</p>
      </section>

      {user.value && !webcamOn && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.value.image} alt="" className="h-16 w-16 rounded-full" />
      )}

      {webcamOn && (
        <video muted playsInline autoPlay className={`${!webcamMediaStream ? 'hidden' : 'aspect-video w-full'}`} ref={webcamVideoRef} />
      )}

      <section className="absolute bottom-3 right-3 flex gap-2">
        {(currentUser === participant.id ? muted : !participant.micOn) && (
          <section className="w-8 h-8 grid place-items-center rounded-full bg-cloudy-500">
            <FontAwesomeIcon icon={faMicrophoneSlash} size="sm" className="text-red-400" />
          </section>
        )}

        {deafened && (
          <section className="w-8 h-8 grid place-items-center rounded-full bg-cloudy-500">
            <FontAwesomeIcon icon={faEarDeaf} size="sm" className="text-red-400" />
          </section>
        )}
      </section>
    </section>
  );
};

export default ParticipantPreview;