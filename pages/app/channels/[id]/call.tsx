import { useEffect, useMemo, useReducer, useState } from 'react';
import { useForceUpdate } from '@mantine/hooks';
import useVoice from '@/lib/store/voice';
import { shallow } from 'zustand/shallow';
import ParticipantPreview from '@/components/channel/call/ParticipantPreview';
import Layout from '@/components/Layout';
import firebaseClient from '@/lib/firebase';
import Channel from '@/lib/classes/channel';
import { useRouter } from 'next/router';
import Meta from '@/components/Meta';
import { faEarDeaf, faEarListen, faGear, faMicrophone, faMicrophoneSlash, faPhone, faPhoneSlash, faShareFromSquare, faVideo, faVideoSlash, faVolumeHigh } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAsync } from 'react-use';
import { Meeting } from '@videosdk.live/js-sdk/meeting';
import { Button } from '@mantine/core';
import openSettingsModal from '@/lib/helpers/openSettingsModal';
import authenticatedServerProps from '@/lib/helpers/authenticatedServerProps';
import useUser from '@/lib/store/user';
import PresenterPreview from '@/components/channel/call/PresenterPreview';

const MeetingView = ({ meeting }: { meeting: Meeting }) => {
  const forceUpdate = useForceUpdate();
  const currentUserId = useUser((s) => s?.id);
  const [reloadParticipants, setReloadParticipants] = useReducer((s) => s + 1, 0);
  const [deafened, muted, video, activeSpeaker, screen] = useVoice((s) => [s.deafened, s.muted, s.video, s.activeTalker, s.screen], shallow);
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

    meeting.on('participant-joined', setReloadParticipants);
    meeting.on('participant-left', setReloadParticipants);
    meeting.on('presenter-changed', forceUpdate);

    return () => {
      meeting.pubSub.unsubscribe('deafen', handler);
      meeting.pubSub.unsubscribe('undeafen', undeafHandler);
      meeting.off('participant-joined', setReloadParticipants);
      meeting.off('participant-left', setReloadParticipants);
      meeting.off('presenter-changed', forceUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const participants = useMemo(() => [meeting.localParticipant, ...meeting.participants.values()], [meeting, reloadParticipants]);
  const presenterParticipant = useMemo(() => participants.find((p) => p.id === meeting.activePresenterId), [meeting.activePresenterId, participants]);

  return (
    <section className="flex flex-col gap-4 overflow-hidden">
      {!meeting.activePresenterId && (
        <section className="flex gap-3 p-8 items-center justify-center flex-wrap flex-grow">
          {participants.map((p) => <ParticipantPreview key={p.id} deafened={listDeafened.includes(p.id)} participant={p} active={activeSpeaker === p.id} />)}
        </section>
      )}

      {meeting.activePresenterId && (
        <section className="flex gap-6 flex-grow p-8 overflow-hidden">
          <section className="flex-grow grid place-items-center flex-shrink">
            {presenterParticipant && (
              <PresenterPreview participant={presenterParticipant} />
            )}
          </section>

          <section className="overflow-auto flex-shrink-0 flex flex-col gap-3 custom_scrollbar pr-1">
            {participants.map((p) => <ParticipantPreview key={p.id} deafened={listDeafened.includes(p.id)} participant={p} active={activeSpeaker === p.id} />)}
          </section>
        </section>
      )}

      {/* Controls */}
      <section className="p-8 flex items-center justify-center right-0 left-0 gap-4">
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
          className={`${!video ? 'bg-cloudy-500' : 'bg-cloudy-50 text-red-500'} cursor-pointer w-16 aspect-square grid place-items-center rounded-full`}
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
          className={`${!meeting.activePresenterId || !screen ? 'bg-cloudy-500' : 'bg-cloudy-50 text-red-500'} ${meeting.activePresenterId && meeting.activePresenterId !== currentUserId ? 'opacity-50 cursor-not-allowed' : ''} cursor-pointer w-16 aspect-square grid place-items-center rounded-full`}
          onClick={() => {
            if (meeting.activePresenterId && meeting.activePresenterId !== currentUserId) return;

            const toggle = !screen;

            useVoice.setState({ screen: toggle });

            if (toggle) meeting.enableScreenShare();
            else meeting.disableScreenShare();
          }}
        >
          <FontAwesomeIcon
            icon={faShareFromSquare}
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
    </section>
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
