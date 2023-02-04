import { openModal } from '@mantine/modals';
import { useEffect } from 'react';
import { useForceUpdate } from '@mantine/hooks';
import { Participant } from '@videosdk.live/js-sdk/participant';
import { useAsync } from 'react-use';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { shallow } from 'zustand/shallow';
import useVoice from '../store/voice';
import firebaseClient from '../firebase';

interface ParticipantPreviewProps {
  participant: Participant;
  active?: boolean;
}

const ParticipantPreview = ({ participant, active }: ParticipantPreviewProps) => {
  const forceRender = useForceUpdate();
  const user = useAsync(() => firebaseClient.managers.user.fetch(participant.id), [participant]);

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
    <section className={`relative h-32 bg-cloudy-700 rounded-lg ${!active ? 'border border-cloudy-600' : 'border-2 border-green-500'} transition-all duration-100 ease-in-out grid place-items-center`}>
      {user.value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.value.image} alt="" className="h-16 w-16 rounded-full" />
      )}

      {!participant.micOn && (
        <section className="absolute bottom-3 right-3 w-8 h-8 grid place-items-center rounded-full bg-cloudy-500">
          <FontAwesomeIcon icon={faMicrophoneSlash} size="sm" className="text-red-400" />
        </section>
      )}
    </section>
  );
};

const ChangeProfileModalContent = () => {
  const [meeting, activeSpeaker] = useVoice((s) => [s.meeting, s.activeTalker], shallow);
  const forceRender = useForceUpdate();

  useEffect(() => {
    if (!meeting) return;

    const updateHandler = () => {
      forceRender();
    };

    meeting.on('participant-joined', updateHandler);
    meeting.on('participant-left', updateHandler);

    return () => {
      meeting.off('participant-joined', updateHandler);
      meeting.off('participant-left', updateHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting]);

  if (!meeting) return null;

  return (
    <section className="grid grid-cols-3 gap-3">
      {[meeting.localParticipant, ...meeting.participants.values()].map((p) => <ParticipantPreview key={p.id} participant={p} active={activeSpeaker === p.id} />)}
    </section>
  );
};

const openVoiceModal = () => {
  openModal({
    modalId: 'voice-modal',
    title: 'Voice',
    children: <ChangeProfileModalContent />,
    size: 'xl',
    centered: true,
  });
};

export default openVoiceModal;