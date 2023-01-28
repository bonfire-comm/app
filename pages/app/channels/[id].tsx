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
import { faAt, faFile, faFileAudio, faPaperPlane, faUpload, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useWindowEvent } from '@mantine/hooks';
import type { Editor } from '@tiptap/core';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useAsync } from 'react-use';
import { LoadingOverlay } from '@mantine/core';
import Messages from '@/components/channel/MessageRenderer';
import useEditMessage from '@/lib/store/editMessage';

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

      <section className="flex gap-3 items-center">
        <FontAwesomeIcon
          icon={faAt}
          size="lg"
          className="text-cloudy-300"
        />

        <h2 className="font-extrabold text-lg">{user.value.name}</h2>
      </section>
    </>
  );
};

const InnerHeader = ({ channel }: { channel?: Channel | null }) => (
  <>
    <Meta page={`${channel?.name}'s chat`} />

    <section className="flex gap-3 items-center">
      <h2 className="font-extrabold text-lg">{channel?.name}</h2>
    </section>
  </>
);

interface DropAreaProps {
  onDrop: (files: File[]) => void;
}

const DropArea = ({ onDrop }: DropAreaProps) => (
  <Dropzone.FullScreen
    onDrop={onDrop}
    maxFiles={10}
    maxSize={1024 * 1024 * 10}
    classNames={{
      inner: 'h-full',
    }}
    active
  >
    <section className="flex flex-col items-center justify-center h-full">
      <FontAwesomeIcon icon={faUpload} size="8x" className="mb-8" />
      <h3 className="text-2xl font-extrabold mb-2">Upload attachments</h3>
      <p>Up to 10 files, 10 MB each</p>
    </section>
  </Dropzone.FullScreen>
);

const AttachmentPreview = ({ attachment, onRemove }: { attachment: File; onRemove?: () => any }) => {
  const Icon = () => {
    if (IMAGE_MIME_TYPE.includes(attachment.type as typeof IMAGE_MIME_TYPE[number])) {
      const url = URL.createObjectURL(attachment);

      return (
        <section className="flex-grow overflow-hidden mb-1">
          <img
            src={url}
            alt=""
            className="h-full mx-auto object-contain rounded"
          />
        </section>
      );
    }

    if (attachment.type.startsWith('video/')) {
      const url = URL.createObjectURL(attachment);

      return (
        <section className="flex-grow flex items-center justify-center overflow-hidden mb-1">
          <video
            src={url}
            controls
            className="w-full mx-auto rounded"
          />
        </section>
      );
    }

    if (attachment.type.startsWith('audio/')) {
      return (
        <span className="flex-grow w-full flex justify-center items-center mb-1">
          <FontAwesomeIcon
            icon={faFileAudio}
            size="5x"
          />
        </span>
      );
    }

    return (
      <span className="flex-grow w-full flex justify-center items-center mb-1">
        <FontAwesomeIcon
          icon={faFile}
          size="5x"
        />
      </span>
    );
  };

  return (
    <section className="grid grid-rows-[1fr_1.5rem] h-56 max-w-[200px] min-w-[200px] relative p-4 bg-cloudy-600 rounded-lg">
      <span
        className="cursor-pointer absolute -top-1 -right-1 bg-red-500 w-7 h-7 grid place-items-center rounded-md z-10"
        onClick={() => onRemove?.()}
      >
        <FontAwesomeIcon
          icon={faXmark}
        />
      </span>

      <Icon />

      <h4 className="align-center overflow-hidden whitespace-nowrap text-ellipsis font-medium">{attachment.name}</h4>
    </section>
  );
};

const Attachments = ({ attachments, onRemove, loading = false }: { loading?: boolean; attachments: File[]; onRemove?: (index: number) => any }) => (
  <section className="relative flex-shrink-0 mt-2 border-[1px] border-cloudy-500 flex gap-6 mx-6 overflow-x-auto p-4 rounded-lg bg-cloudy-700 custom_scrollbar">
    <LoadingOverlay visible={loading} />
    {attachments.map((attachment, i) => <AttachmentPreview key={i} attachment={attachment} onRemove={() => onRemove?.(i)} />)}
  </section>
);

export default function ChannelPage() {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const [channel, setChannel] = useState<Channel | null>(firebaseClient.managers.channels.cache.get(router.query.id as string) ?? null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const editMessage = useEditMessage();

  // Channel cache
  useEffect(() => {
    const handler = (id: string, ch: Channel) => setChannel(ch);

    firebaseClient.managers.channels.cache.events.on('changed', handler);
    firebaseClient.managers.channels.cache.events.on('set', handler);

    return () => {
      firebaseClient.managers.channels.cache.events.off('changed', handler);
      firebaseClient.managers.channels.cache.events.off('set', handler);
    };
  }, []);

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
      await channel.postMessage(content, attachments);
    }

    editorRef.current?.commands.clearContent();
    setAttachments([]);
    setSending(false);
  };

  useWindowEvent('paste', (ev) => {
    const files = ev.clipboardData?.files;
    if (!files) return;

    const [file] = files;
    if (!file || !IMAGE_MIME_TYPE.includes(file.type as any)) return;

    ev.preventDefault();
    onAttachment([file]);
  });

  useEffect(() => {
    if (!editMessage.editing || !editMessage.message || !editorRef.current) return;

    editorRef.current.commands.setContent(editMessage.message.content);
  }, [editorRef, editMessage]);

  return (
    <Layout
      innerHeader={
        <section className="flex px-6 items-center h-full w-full">
          {channel?.isDM ? <DMInnerHeader channel={channel} /> : <InnerHeader channel={channel} />}
        </section>
      }
    >
      <DropArea onDrop={onAttachment} />

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
              className="cursor-pointer hover:bg-cloudy-600 hover:bg-opacity-50 transition-colors duration-100 rounded-lg absolute top-[1px] right-[1px] bottom-[1px] z-10 w-12 grid place-items-center"
              onClick={() => send()}
            >
              <FontAwesomeIcon
                icon={faPaperPlane}
                size="lg"
              />
            </section>

            <TextEditor
              editorRef={editorRef}
              content=""
              className="w-full"
              placeholder="Write your message here"
              onSend={send}
              clearOnSend={false}
            />
          </section>

          <p className="select-none text-xs opacity-60">Use <code>shift + enter</code> to send</p>
        </section>
      </section>
    </Layout>
  );
}

export const getServerSideProps = authenticatedServerProps();