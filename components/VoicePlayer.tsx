import useVoice from '@/lib/store/voice';
import { useForceUpdate } from '@mantine/hooks';
import { Participant } from '@videosdk.live/js-sdk/participant';
import { memo, useRef, useEffect } from 'react';
import { shallow } from 'zustand/shallow';

const VoicePlayer = memo(({ participant }: { participant: Participant }) => {
  const forceRender = useForceUpdate();
  const deaf = useVoice((s) => s.deafened);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const audioStream = [...participant.streams.values()].find((s) => s.kind === 'audio');

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

  if (!audioStream) return null;

  return <audio className="hidden" autoPlay playsInline muted={deaf} controls={false} ref={audioRef} />;
}, (prev, next) => prev.participant === next.participant);

VoicePlayer.displayName = 'VoicePlayer';

export default VoicePlayer;

export const MeetingVoicePlayer = () => {
  const forceRender = useForceUpdate();
  const [meeting, state] = useVoice((s) => [s.meeting, s.state], shallow);

  useEffect(() => {
    if (!meeting) return ;
    const updateHandler = () => {
      forceRender();
    };

    meeting.on('participant-joined', updateHandler);
    meeting.on('participant-left', updateHandler);

    return () => {
      meeting.off('participant-joined', updateHandler);
      meeting.off('participant-left', updateHandler);
    };
  });

  return (
    <>
      {meeting && state === 'CONNECTED' && (
        [...meeting.participants.values()].map((p) => <VoicePlayer key={p.id} participant={p} />)
      )}
    </>
  );
};