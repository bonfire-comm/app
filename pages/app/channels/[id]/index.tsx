import 'highlight.js/styles/github-dark.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import Layout from '@/components/Layout';
import Meta from '@/components/Meta';
import TextEditor from '@/components/TextEditor';
import Channel from '@/lib/classes/channel';
import firebaseClient from '@/lib/firebase';
import authenticatedServerProps from '@/lib/helpers/authenticatedServerProps';
import useUser from '@/lib/store/user';
import { faAt, faGear, faHashtag, faPaperPlane, faPhone, faPlus, faPlusCircle, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useClipboard, useForceUpdate, useInterval, useWindowEvent } from '@mantine/hooks';
import type { Editor } from '@tiptap/core';
import { useRouter } from 'next/router';
import { MutableRefObject, useEffect, useReducer, useRef, useState } from 'react';
import { useAsync } from 'react-use';
import { Avatar, LoadingOverlay, Tooltip } from '@mantine/core';
import Messages from '@/components/channel/MessageRenderer';
import useMessageAction from '@/lib/store/messageAction';
import Attachments, { DropArea } from '@/components/channel/AttachmentHandler';
import { showNotification } from '@mantine/notifications';
import Twemoji from '@/components/Twemoji';
import trimEmptyParagraphTag from '@/lib/helpers/trimEmptyParagraphTag';
import { noop } from 'lodash-es';
import useInternal from '@/lib/store';
import { shallow } from 'zustand/shallow';
import User from '@/lib/classes/user';
import UserList from '@/components/UserList';
import openProfileModal from '@/lib/helpers/openProfileModal';
import { openEditChannelModal } from '@/lib/helpers/openCreateChannelModal';
import openLeaveGroupModal from '@/lib/helpers/openLeaveGroupModal';
import useMenu from '@/lib/store/menu';
import sleep from '@/lib/helpers/sleep';
import { openConfirmModal } from '@mantine/modals';
import useVoice from '@/lib/store/voice';

const ToggleShowParticipant = () => {
  const [show, setShow] = useInternal((s) => [s.showParticipants, s.setShowParticipants], shallow);

  return (
    <Tooltip
      label="Toggle List"
      color="blue"
      withArrow
      arrowSize={6}
      offset={10}
    >
      <FontAwesomeIcon
        icon={faUser}
        className={`${show ? 'text-cloudy-100' : 'text-cloudy-300'} cursor-pointer`}
        onClick={() => setShow(!show)}
      />
    </Tooltip>
  );
};

const ControlIcons = ({ channel }: { channel?: Channel | null }) => {
  const [val, forceRender] = useReducer((v) => v + 1, 0);
  const uid = useUser((s) => s?.id);
  const [room, ongoing, meeting, SDK] = useVoice((s) => [s.room, s.ongoingSession, s.meeting, s.SDK], shallow);

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

  const interval = useInterval(async () => {
    if (!channel) return;

    const fetchOngoing = await channel.fetchVoiceOngoingSession().catch(() => null);

    useVoice.setState({
      ongoingSession: fetchOngoing,
    });
  }, 15_000);

  useEffect(() => {
    if (!channel) return;

    (async () => {
      const fetchRoom = await channel.fetchVoiceRoom().catch(() => null);
      const fetchOngoing = await channel.fetchVoiceOngoingSession().catch(() => null);

      useVoice.setState({
        room: fetchRoom,
        ongoingSession: fetchOngoing,
      });

      interval.start();
    })();

    return () => {
      interval.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SDK, channel]);

  const voiceParticipants = useAsync(async () => {
    if (!channel) return [];

    if (ongoing && !meeting) {
      const users = (await Promise.all(ongoing.participants.map((v) => firebaseClient.managers.user.fetch(v.participantId)))).filter(Boolean) as User[];

      return users;
    }

    if (!meeting) return [];

    const users = (await Promise.all([meeting.localParticipant.id, ...meeting.participants.keys()].map((v) => firebaseClient.managers.user.fetch(v)) ?? [])).filter(Boolean) as User[];
    return users;
  }, [channel, ongoing, meeting, val]);

  const startVoiceChat = async () => {
    await channel?.startVoice(true);
  };

  return (
    <section className="flex gap-4 items-center">
      {channel && channel.owner === uid && (
        <Tooltip
          label="Settings"
          color="blue"
          withArrow
          arrowSize={6}
          offset={10}
        >
          <FontAwesomeIcon
            icon={faGear}
            className="cursor-pointer"
            onClick={() => openEditChannelModal(channel)}
          />
        </Tooltip>
      )}

      <section className="flex items-center gap-3">
        {meeting && meeting.id === room?.roomId && voiceParticipants.value && voiceParticipants.value.length > 0 && (
          <Avatar.Group>
            {voiceParticipants.value.slice(0, 3).map((v) => (
              <Tooltip
                key={v.id}
                position="bottom"
                label={v.name}
                color="blue"
                withArrow
                arrowSize={6}
                offset={10}
              >
                <Avatar classNames={{ root: 'border-[2px] border-cloudy-700' }} size="md" src={v.image} radius="xl" />
              </Tooltip>
            ))}

            {voiceParticipants.value.length > 3 && (
              <Avatar color="gray">+{voiceParticipants.value.length - 3}</Avatar>
            )}
          </Avatar.Group>
        )}

        {(!meeting || meeting.id !== room?.roomId) && (
          <Tooltip
            label="Start Voice Chat"
            color="blue"
            withArrow
            arrowSize={6}
            offset={10}
          >
            <FontAwesomeIcon
              icon={faPhone}
              className={!room ? 'cursor-progress opacity-50' : 'cursor-pointer'}
              onClick={() => room && startVoiceChat()}
            />
          </Tooltip>
        )}
      </section>

      <ToggleShowParticipant />

      {channel && !channel.isDM && channel.owner !== uid && (
        <Tooltip
          label="Leave"
          color="blue"
          withArrow
          arrowSize={6}
          offset={10}
        >
          <FontAwesomeIcon
            icon={faRightFromBracket}
            className="cursor-pointer text-red-400"
            onClick={() => openLeaveGroupModal(channel)}
          />
        </Tooltip>
      )}
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
            icon={channel.isDM ? faAt : faHashtag}
            size="lg"
            className="text-cloudy-300"
          />

          <h2 className="font-extrabold text-lg">{name.value}</h2>
        </section>

        <ControlIcons channel={channel} />
      </section>
    </>
  );
};

const MAX_CHARACTER = 2000;

const CharacterCounter = ({ editor, forceUpdateRef }: { editor: MutableRefObject<Editor | null>; forceUpdateRef?: MutableRefObject<() => void> }) => {
  const force = useForceUpdate();

  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    if (forceUpdateRef) forceUpdateRef.current = force;
  }, [forceUpdateRef, force]);

  const currentAmount = editor.current?.storage.characterCount.characters() ?? 0;

  return (
    <section className={['select-none text-sm', MAX_CHARACTER - currentAmount <= 100 ? 'text-red-500 font-medium' : 'text-cloudy-300'].filter(Boolean).join(' ')}>
      {currentAmount}/{MAX_CHARACTER} characters
    </section>
  );
};

const Header = ({ channel }: { channel: Channel }) => (
  <section className="flex px-6 items-center h-full w-full">
    <InnerHeader channel={channel} />
  </section>
);

const ParticipantList = ({ channel }: { channel: Channel | null }) => {
  const uid = useUser((s) => s?.id);
  const [updateCount, forceRender] = useReducer((v) => v + 1, 0);
  const setContextItems = useMenu((s) => s.setContextMenuItems);
  const clipboard = useClipboard({ timeout: 2000 });
  const router = useRouter();
  const users = useAsync(async () => {
    if (!channel) return [];

    return (await Promise.all(Object.keys(channel?.participants).map((id) => firebaseClient.managers.user.fetch(id)))).filter(Boolean) as User[];
  }, [channel, updateCount]);

  useEffect(() => {
    if (!channel) return;

    const handler = () => {
      forceRender();
    };

    channel.events.on('changed', handler);

    return () => {
      channel.events.off('changed', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  const createInvite = async () => {
    if (!channel) return;

    const invite = await channel.createInvite();
    if (!invite) return;

    clipboard.copy(`${window.location.origin}/invite/${invite.id}`);
    showNotification({
      color: 'green',
      title: <Twemoji>📋 Copied!</Twemoji>,
      message: 'Invite copied to clipboard'
    });
  };

  return (
    <section className="flex-shrink-0 w-72 bg-cloudy-700 p-4 flex flex-col gap-1 overflow-y-auto">
      <section className="flex justify-between px-3 my-2 items-center gap-4">
        <h3 className="font-extrabold text-sm text-cloudy-300">PARTICIPANTS</h3>

        {!channel?.isDM && (
          <Tooltip
            label="Add participant"
            color="blue"
            withArrow
            arrowSize={6}
            offset={8}
          >
            <FontAwesomeIcon
              icon={faPlus}
              className="cursor-pointer"
              onClick={createInvite}
            />
          </Tooltip>
        )}
      </section>

      {users.value && users.value.map((u) => (
        <UserList
          key={u.id}
          enableClick
          onClick={() => openProfileModal(u)}
          onContextMenu={async () => {
            await sleep(0);
            setContextItems((Menu) => (
              <>
                <Menu.Item onClick={() => openProfileModal(u)}>Profile</Menu.Item>

                {!u.isSelf && (
                  <Menu.Item onClick={async () => {
                    const id = await firebaseClient.managers.channels.createDM(u.id).catch(() => null);
                    if (!id) return;

                    router.push(`/app/channels/${id}`);
                  }}>Message</Menu.Item>
                )}

                {channel && !channel.isDM && channel.owner !== u.id && channel.owner === uid && (
                  <>
                    <Menu.Divider />

                    <Menu.Label>Manage</Menu.Label>

                    <Menu.Item color="yellow" onClick={() => {
                      openConfirmModal({
                        centered: true,
                        title: 'Are you sure?',
                        children: <p>This action is not reversible.</p>,
                        closeOnConfirm: true,
                        labels: {
                          confirm: 'Continue',
                          cancel: 'Cancel'
                        },
                        confirmProps: {
                          color: 'red'
                        },
                        cancelProps: {
                          color: 'gray'
                        },
                        onConfirm: async () => {
                          await channel.removeParticipant(u.id)?.commit();
                        },
                        zIndex: 1000000000
                      });
                    }}>Kick {u.name}</Menu.Item>

                    <Menu.Item color="red" onClick={() => {
                      openConfirmModal({
                        centered: true,
                        title: 'Are you sure?',
                        children: <p>This action is not reversible.</p>,
                        closeOnConfirm: true,
                        labels: {
                          confirm: 'Continue',
                          cancel: 'Cancel'
                        },
                        confirmProps: {
                          color: 'red'
                        },
                        cancelProps: {
                          color: 'gray'
                        },
                        onConfirm: async () => {
                          await channel.ban(u.id)?.commit();
                        },
                        zIndex: 1000000000
                      });
                    }}>Ban {u.name}</Menu.Item>
                  </>
                )}
              </>
            ));
          }}
          user={u}
          barebone
          avatarSize={38}
          showCrown={u.id === channel?.owner}
        />
      ))}
    </section>
  );
};

const ACTION_ICON_CLASS_NAME = 'cursor-pointer h-full grid place-items-center text-cloudy-300 hover:text-cloudy-50 hover:bg-cloudy-600 hover:bg-opacity-50 transition-colors duration-100 px-4';

export default function ChannelPage() {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const [channel, setChannel] = useState<Channel | null>(firebaseClient.managers.channels.cache.get(router.query.id as string) ?? null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const messageAction = useMessageAction();
  const openRef = useRef<() => void>(noop);
  const characterCountRender = useRef<() => void>(noop);
  const showParticipants = useInternal((s) => s.showParticipants);

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

  // Message register & Clean up
  useEffect(() => {
    if (!channel) return;

    const routerChangeHandler = () => {
      channel.stopListenMessages();
      channel.clean();
    };
    router.events.on('routeChangeStart', routerChangeHandler);

    channel.listenMessages();

    return () => {
      channel.stopListenMessages();
      router.events.off('routeChangeStart', routerChangeHandler);
    };
  }, [channel, router.events]);

  // Events
  const onAttachment = (files: File[]) => setAttachments((prev) => [...prev, ...files].slice(0, 10));
  const onAttachmentRemove = (index: number) => setAttachments((prev) => prev.filter((_, i) => i !== index));
  const send = async (content?: string) => {
    if (!channel) return;
    if (!content) {
      // eslint-disable-next-line no-param-reassign
      content = editorRef.current?.getHTML();

      if (!content) return;
    }

    if (editorRef.current?.getText().trim().length === 0) {
      if (attachments.length === 0) return;

      // eslint-disable-next-line no-param-reassign
      content = '';
    }

    setSending(true);

    if (messageAction.editing) {
      await messageAction.message?.set({
        content
      }).commit(true);
    } else {
      try {
        await channel.postMessage(trimEmptyParagraphTag(content), {
          attachments,
          replyTo: messageAction.replying && messageAction.message
            ? messageAction.message.id
            : null
        });
      } catch (err: any) {
        setSending(false);

        if (err.message === 'cooldown') {
          return showNotification({
            id: 'cooldown-error',
            color: 'red',
            title: <Twemoji>❌ Cooldown</Twemoji>,
            message: 'You are sending messages too fast, please wait a bit.'
          });
        }

        if (err.message === 'blocked') {
          return showNotification({
            color: 'red',
            title: <Twemoji>❌ Blocked</Twemoji>,
            message: 'You have been blocked by this user.'
          });

        }
        if (err.message === 'you-blocked') {
          return showNotification({
            color: 'red',
            title: <Twemoji>❌ Blocked</Twemoji>,
            message: 'You have blocked this user.'
          });
        }

        if (err.message === 'not_participant') {
          return showNotification({
            color: 'red',
            title: <Twemoji>❌ Not a participant</Twemoji>,
            message: 'You are not a participant of this channel.'
          });
        }

        // eslint-disable-next-line no-console
        console.error(err);

        return showNotification({
          color: 'red',
          title: <Twemoji>❌ Error</Twemoji>,
          message: 'Something went wrong, please try again later.'
        });
      }
    }

    useMessageAction.setState({
      editing: false,
      replying: false,
      message: null
    });

    editorRef.current?.commands.clearContent();
    setAttachments([]);
    setSending(false);
  };

  useWindowEvent('paste', (ev) => {
    const files = (ev as unknown as ClipboardEvent).clipboardData?.files;
    if (!files) return;

    const [file] = files;
    if (!file || !IMAGE_MIME_TYPE.includes(file.type as any)) return;

    ev.preventDefault();
    onAttachment([file]);
  });

  useWindowEvent('keyup', ({ key }) => {
    if (key === 'Escape' && useMessageAction.getState().editing) {
      useMessageAction.setState({
        editing: false,
        message: null
      });

      editorRef.current?.commands.clearContent();
    }
  });

  useEffect(() => {
    if (!messageAction.editing || !messageAction.message || !editorRef.current) return;

    editorRef.current.commands.setContent(messageAction.message.content);
  }, [editorRef, messageAction]);

  const messageActionAuthor = useAsync(async () => {
    if (!messageAction?.message?.author) return null;

    const user = await firebaseClient.managers.user.fetch(messageAction.message.author);

    return user;
  }, [messageAction.message]);

  if (!channel) return null;

  return (
    <Layout
      innerHeader={<Header channel={channel} />}
    >
      <DropArea onDrop={onAttachment} openRef={openRef} />

      <section className="flex overflow-hidden">
        <section className="flex flex-col flex-grow overflow-hidden">
          <Messages channel={channel} />

          {attachments.length > 0 && (
            <Attachments loading={sending} onRemove={onAttachmentRemove} attachments={attachments} />
          )}

          <section className="flex-shrink-0 flex flex-col p-6 pt-4 min-h-[6rem] w-full">
            {messageAction.editing && (
              <section className="mb-2 flex gap-2 items-center">
                <span className="text-cloudy-100 font-medium">Editing message</span>
                <span onClick={() => {
                  useMessageAction.setState({ editing: false, message: null });
                  editorRef.current?.commands.clearContent();
                }} className="text-blue-500 cursor-pointer">cancel</span>
              </section>
            )}

            {messageAction.replying && (
              <section className="mb-2 flex gap-2 items-center">
                <span className="text-cloudy-100 font-medium">Replying to <span className="font-bold">{messageActionAuthor.value?.name}</span></span>
                <span onClick={() => {
                  useMessageAction.setState({ replying: false, message: null });
                }} className="text-blue-500 cursor-pointer">cancel</span>
              </section>
            )}

            <section className="relative w-full mb-2">
              <LoadingOverlay visible={sending} />

              <section
                className="rounded-lg absolute top-[1px] right-[1px] bottom-[1px] z-10 flex"
              >
                <span onClick={() => openRef.current()} className={ACTION_ICON_CLASS_NAME}>
                  <FontAwesomeIcon
                    icon={faPlusCircle}
                    size="lg"
                  />
                </span>

                <span onClick={() => send()} className={ACTION_ICON_CLASS_NAME}>
                  <FontAwesomeIcon
                    icon={faPaperPlane}
                    size="lg"
                  />
                </span>
              </section>

              <TextEditor
                editorRef={editorRef}
                content=""
                className="w-full"
                placeholder="Write your message here"
                onSend={send}
                clearOnSend={false}
                maxCharacters={MAX_CHARACTER}
                onChange={() => characterCountRender.current()}
              />
            </section>

            <section className="flex justify-between items-center">
              <p className="select-none text-xs opacity-60">Use <code>ctrl + enter</code> to send</p>

              <CharacterCounter editor={editorRef} forceUpdateRef={characterCountRender} />
            </section>
          </section>
        </section>

        {showParticipants && <ParticipantList channel={channel} />}
      </section>
    </Layout>
  );
}

export const getServerSideProps = authenticatedServerProps();