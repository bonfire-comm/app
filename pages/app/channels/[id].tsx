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
import { faAt, faPaperPlane, faPlus, faPlusCircle, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useClipboard, useForceUpdate, useWindowEvent } from '@mantine/hooks';
import type { Editor } from '@tiptap/core';
import { useRouter } from 'next/router';
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { useAsync } from 'react-use';
import { LoadingOverlay, Tooltip } from '@mantine/core';
import Messages from '@/components/channel/MessageRenderer';
import useEditMessage from '@/lib/store/editMessage';
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

const DMInnerHeader = ({ channel }: { channel: Channel }) => {
  const currentUserId = useUser((state) => state?.id);
  const user = useAsync(async () => {
    if (!currentUserId) return;

    const [participant] = Object.keys(channel.participants).filter((v) => v !== currentUserId);

    const resolved = await firebaseClient.managers.user.fetch(participant);
    return resolved;
  }, [channel, currentUserId]);

  if (user.loading || !user.value) return null;

  return (
    <>
      <Meta page={`${user.value.name}'s chat`} />

      <section className="flex justify-between items-center flex-grow">
        <section className="flex gap-3 items-center">
          <FontAwesomeIcon
            icon={faAt}
            size="lg"
            className="text-cloudy-300"
          />

          <h2 className="font-extrabold text-lg">{user.value.name}</h2>
        </section>

        <ToggleShowParticipant />
      </section>
    </>
  );
};

const InnerHeader = ({ channel }: { channel?: Channel | null }) => (
  <>
    <Meta page={`${channel?.name}'s chat`} />

    <section className="flex justify-between items-center flex-grow">
      <section className="flex gap-3 items-center">
        <h2 className="font-extrabold text-lg">{channel?.name}</h2>
      </section>

      <ToggleShowParticipant />
    </section>
  </>
);

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

const Header = ({ channel }: { channel?: Channel | null }) => (
  <section className="flex px-6 items-center h-full w-full">
    {channel?.isDM ? <DMInnerHeader channel={channel} /> : <InnerHeader channel={channel} />}
  </section>
);

const ParticipantList = ({ channel }: { channel: Channel | null }) => {
  const forceRender = useForceUpdate();
  const clipboard = useClipboard({ timeout: 2000 });
  const users = useAsync(async () => {
    if (!channel) return [];

    return (await Promise.all(Object.keys(channel?.participants).map((id) => firebaseClient.managers.user.fetch(id)))).filter(Boolean) as User[];
  }, [channel]);

  useEffect(() => {
    if (!channel) return;

    const handler = () => forceRender();

    channel.events.on('participant', handler);

    return () => {
      channel.events.off('participant', handler);
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
  const editMessage = useEditMessage();
  const openRef = useRef<() => void>(noop);
  const characterCountRender = useRef<() => void>(noop);
  const showParticipants = useInternal((s) => s.showParticipants);

  // Channel cache
  useEffect(() => {
    const handler = (id: string, ch: Channel) => router.query.id === id && setChannel(ch);

    firebaseClient.managers.channels.cache.events.on('changed', handler);
    firebaseClient.managers.channels.cache.events.on('set', handler);

    return () => {
      firebaseClient.managers.channels.cache.events.off('changed', handler);
      firebaseClient.managers.channels.cache.events.off('set', handler);
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

    if (editMessage.editing) {
      await editMessage.message?.set({
        content
      }).commit(true);

      useEditMessage.setState({
        editing: false,
        message: null
      });
    } else {
      try {
        await channel.postMessage(trimEmptyParagraphTag(content), attachments);
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

        return showNotification({
          color: 'red',
          title: <Twemoji>❌ Error</Twemoji>,
          message: 'Something went wrong, please try again later.'
        });
      }
    }

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
    if (key === 'Escape' && useEditMessage.getState().editing) {
      useEditMessage.setState({
        editing: false,
        message: null
      });

      editorRef.current?.commands.clearContent();
    }
  });

  useEffect(() => {
    if (!editMessage.editing || !editMessage.message || !editorRef.current) return;

    editorRef.current.commands.setContent(editMessage.message.content);
  }, [editorRef, editMessage]);

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
            {editMessage.editing && (
              <section className="mb-2 flex gap-2 items-center">
                <span className="text-cloudy-100 font-medium">Editing message</span>
                <span onClick={() => {
                  useEditMessage.setState({ editing: false, message: null });
                  editorRef.current?.commands.clearContent();
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