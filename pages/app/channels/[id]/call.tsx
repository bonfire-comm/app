import { useEffect, useState } from 'react';
import { useForceUpdate } from '@mantine/hooks';
import useVoice from '@/lib/store/voice';
import { shallow } from 'zustand/shallow';
import ParticipantPreview from '@/components/channel/call/ParticipantPreview';
import Layout from '@/components/Layout';
import firebaseClient from '@/lib/firebase';
import Channel from '@/lib/classes/channel';
import { useRouter } from 'next/router';
import Meta from '@/components/Meta';
import { faEarDeaf, faEarListen, faGear, faMicrophone, faMicrophoneSlash, faPhone, faPhoneSlash, faVideo, faVideoSlash, faVolumeHigh } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAsync } from 'react-use';
import { Meeting } from '@videosdk.live/js-sdk/meeting';
import { Button } from '@mantine/core';
import openSettingsModal from '@/lib/helpers/openSettingsModal';
import authenticatedServerProps from '@/lib/helpers/authenticatedServerProps';

const MeetingView = ({ meeting }: { meeting: Meeting }) => {
  const [deafened, muted, video, activeSpeaker] = useVoice((s) => [s.deafened, s.muted, s.video, s.activeTalker], shallow);
  const [listDeafened, setListDeafened] = useState<string[]>([]);

  useEffect(() => {
    const handler = (payload: { message: string }) => {
      setListDeafened((s) => [...new Set([...s, payload.message]).values()]);
    };

    const undeafHandler = (payload: { message: string }) => {
      setListDeafened((s) => s.filter((i) => i !== payload.message));
    };

    meeting.pubSub.subscribe('deafen', handler);
    meeting.pubSub.subscribe('undeafen', undeafHandler);

    return () => {
      meeting.pubSub.unsubscribe('deafen', handler);
      meeting.pubSub.unsubscribe('undeafen', undeafHandler);
    };
  }, [meeting]);

  return (
    <>
      <section className="flex gap-3 p-8 items-center justify-center flex-wrap">
        {[meeting.localParticipant, ...meeting.participants.values()].map((p) => <ParticipantPreview key={p.id} deafened={listDeafened.includes(p.id)} participant={p} active={activeSpeaker === p.id} />)}
      </section>

      <section className="absolute bottom-0 p-8 flex items-center justify-center right-0 left-0 gap-4">
        <span
          className="bg-cloudy-500 cursor-pointer w-16 aspect-square grid place-items-center rounded-full"
          onClick={openSettingsModal}
        >
          <FontAwesomeIcon
            icon={faGear}
            className="transition-colors duration-200 ease-in-out"
            size="xl"
          />
        </span>

        <span
          className={`${!muted ? 'bg-cloudy-500' : 'bg-cloudy-50 text-red-500'} cursor-pointer w-16 aspect-square grid place-items-center rounded-full`}
          onClick={() => {
            const toggle = !muted;

            useVoice.setState({ muted: toggle });

            if (toggle) meeting.muteMic();
            else meeting.unmuteMic();
          }}
        >
          <FontAwesomeIcon
            icon={muted ? faMicrophoneSlash : faMicrophone}
            className="transition-colors duration-200 ease-in-out"
            size="xl"
          />
        </span>

        <span
          className={`${!deafened ? 'bg-cloudy-500' : 'bg-cloudy-50 text-red-500'} cursor-pointer w-16 aspect-square grid place-items-center rounded-full`}
          onClick={() => {
            const toggle = !deafened;

            useVoice.setState({
              deafened: toggle,
            });

            if (toggle) {
              meeting.pubSub.publish('deafen', meeting.localParticipant.id, { persist: false });
            } else {
              meeting.pubSub.publish('undeafen', meeting.localParticipant.id, { persist: false });
            }
          }}
        >
          <FontAwesomeIcon
            icon={deafened ? faEarDeaf : faEarListen}
            className="transition-colors duration-200 ease-in-out"
            size="xl"
          />
        </span>

        <span
          className={`${video ? 'bg-cloudy-500' : 'bg-cloudy-50 text-red-500'} cursor-pointer w-16 aspect-square grid place-items-center rounded-full`}
          onClick={() => {
            const toggle = !video;

            useVoice.setState({ video: toggle });

            if (toggle) meeting.enableWebcam();
            else meeting.disableWebcam();
          }}
        >
          <FontAwesomeIcon
            icon={video ? faVideo : faVideoSlash}
            className="transition-colors duration-200 ease-in-out"
            size="xl"
          />
        </span>

        <span
          className="bg-red-500 text-white cursor-pointer w-16 aspect-square grid place-items-center rounded-full"
          onClick={() => meeting.leave()}
        >
          <FontAwesomeIcon
            icon={faPhoneSlash}
            className="transition-colors duration-200 ease-in-out"
            size="xl"
          />
        </span>
      </section>
    </>
  );
};

const InnerHeader = ({ channel }: { channel: Channel }) => {
  const name = useAsync(async () => channel.resolveName());

  return (
    <>
      <Meta page={name.loading ? 'Loading chat...' : `${name.value}'s chat`} />

      <section className="flex justify-between items-center flex-grow">
        <section className="flex gap-3 items-center">
          <FontAwesomeIcon
            icon={faVolumeHigh}
            size="lg"
            className="text-cloudy-300"
          />

          <h2 className="font-extrabold text-lg">{name.value}</h2>
        </section>
      </section>
    </>
  );
};

const VoiceModalContent = () => {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel | null>(firebaseClient.managers.channels.cache.get(router.query.id as string) ?? null);
  const [joining, setJoining] = useState(false);

  // Channel cache
  useEffect(() => {
    const handler = (id: string, ch: Channel) => router.query.id === id && setChannel(ch);
    const deleteHandler = () => {
      setChannel(null);
      router.push('/app');
    };

    firebaseClient.managers.channels.cache.events.on('changed', handler);
    firebaseClient.managers.channels.cache.events.on('set', handler);
    firebaseClient.managers.channels.cache.events.on('delete', deleteHandler);

    return () => {
      firebaseClient.managers.channels.cache.events.off('changed', handler);
      firebaseClient.managers.channels.cache.events.off('set', handler);
      firebaseClient.managers.channels.cache.events.off('delete', deleteHandler);
    };
  }, [router]);

  const meeting = useVoice((s) => s.meeting);
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

  if (!channel) return null;

  const joinVoice = async () => {
    setJoining(true);

    await channel.startVoice(true);

    setJoining(false);
  };

  return (
    <Layout
      innerHeader={
        <section className="flex px-6 items-center h-full w-full">
          <InnerHeader channel={channel} />
        </section>
      }
    >
      {meeting && (<MeetingView meeting={meeting} />)}
      {!meeting && (
        <section className="flex justify-center items-center flex-grow flex-col">
          <FontAwesomeIcon icon={faPhone} size="6x" className="mb-12" />

          <Button disabled={joining} loading={joining} className="rounded-full overflow-hidden font-bold" size="lg" onClick={joinVoice}>Join Call</Button>
        </section>
      )}
    </Layout>
  );
};

export default VoiceModalContent;

export const getServerSideProps = authenticatedServerProps();
