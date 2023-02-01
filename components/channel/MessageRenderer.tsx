/* eslint-disable @next/next/no-img-element */
import Channel from '@/lib/classes/channel';
import Message from '@/lib/classes/message';
import firebaseClient from '@/lib/firebase';
import coupleMessages from '@/lib/helpers/coupleMessages';
import download from '@/lib/helpers/download';
import fetchEmbed from '@/lib/helpers/fetchEmbed';
import useEditMessage from '@/lib/store/editMessage';
import { faDownload, faFile, faIdCard, faPencil, faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@mantine/core';
import { IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useClipboard } from '@mantine/hooks';
import { DateTime } from 'luxon';
import { useReducer, createRef, useEffect, useLayoutEffect, useRef, UIEventHandler, RefObject, useState, useMemo, memo } from 'react';
import { useAsync } from 'react-use';
import { uniq } from 'lodash-es';
import highlightElement from '@/lib/helpers/highlightElement';
import Embed from '../Embed';

const AttachmentEntry = ({ attachment }: { attachment: ChannelMessageAttachmentData}) => {
  if (IMAGE_MIME_TYPE.includes(attachment.type as typeof IMAGE_MIME_TYPE[number])) {
    return (
      <img
        src={attachment.url}
        alt=""
        className="w-min max-h-80 rounded"
      />
    );
  }

  if (attachment.type.startsWith('video/')) {
    return (
      <video
        src={attachment.url}
        controls
        className="h-80 w-min rounded"
      />
    );
  }

  if (attachment.type.startsWith('audio/')) {
    return (
      <section className="bg-cloudy-700 w-min p-4 rounded-xl border-[1px] border-cloudy-500 border-opacity-75">
        <h3 className="whitespace-nowrap mb-3 text-lg font-bold">{attachment.name}</h3>
        <audio className="w-full" src={attachment.url} controls />
      </section>
    );
  }

  return (
    <section className="relative w-min px-6 py-8 bg-cloudy-700 rounded-lg border-[1px] border-cloudy-500">
      <span
        className="cursor-pointer absolute right-6 top-4 opacity-75 hover:opacity-100 transition-opacity duration-100 ease-in-out"
        onClick={() => download(attachment.url, attachment.name)}
      >
        <FontAwesomeIcon
          icon={faDownload}
          size="lg"
        />
      </span>

      <FontAwesomeIcon
        icon={faFile}
        size="4x"
        className="mx-auto block mb-4 opacity-50"
      />
      <h3 className="whitespace-nowrap font-medium">{attachment.name}</h3>
    </section>
  );
};

const EditedMark = ({ editedAt }: {editedAt: Date}) => (
  <Tooltip
    label={
      <>
        <span className="capitalize">{DateTime.fromJSDate(editedAt).toRelativeCalendar()}</span>
        {' at '}
        <span className="capitalize">{DateTime.fromJSDate(editedAt).toFormat('HH:mm')}</span>
      </>
    }
    color="blue"
    withArrow
    arrowSize={6}
    position="top"
    className="text-cloudy-300 text-sm"
  >
    <span>(edited)</span>
  </Tooltip>
);

const Attachments = ({ attachments }: { attachments: ChannelMessageAttachmentData[] }) => (
  <section className="flex flex-col w-auto gap-4 mt-2">
    {attachments.map((a) => <AttachmentEntry key={a.id ?? a.url} attachment={a} />)}
  </section>
);

const ActionPopOver = ({ message }: { message: Message }) => {
  const clipboard = useClipboard({ timeout: 2000 });

  return (
    <section className="hidden group-hover:block absolute right-4 -top-2 bg-cloudy-500 overflow-hidden rounded-lg border-[1px] border-cloudy-400 border-opacity-50">
      {message.author === firebaseClient.auth.currentUser?.uid && (
        <>
          <span onClick={() => useEditMessage.setState({ editing: true, message })} className="cursor-pointer p-2 hover:bg-cloudy-600">
            <FontAwesomeIcon icon={faPencil} size="sm" />
          </span>

          <span onClick={() => message.delete()} className="cursor-pointer p-2 hover:bg-cloudy-600">
            <FontAwesomeIcon icon={faTrash} className="text-red-500" size="sm" />
          </span>
        </>
      )}

      <span onClick={() => clipboard.copy(message.id)} className="cursor-pointer p-2 hover:bg-cloudy-600">
        <FontAwesomeIcon icon={faIdCard} size="sm" />
      </span>
    </section>
  );
};

const EmbedRenderer = memo(({ content, contentRef }: { content: string; contentRef: RefObject<HTMLDivElement> }) => {
  const [embeds, setEmbeds] = useState<EmbedData[]>([]);

  useEffect(() => {
    const cancel = new AbortController();

    (async () => {
      if (!contentRef.current) return;

      const links = uniq([...contentRef.current.querySelectorAll('a')].map((el) => el.href));
      const all = (await Promise.all(links.map((link) => fetchEmbed(link, cancel.signal)))).filter(Boolean) as EmbedData[];

      setEmbeds(all);
    })();

    return () => cancel.abort();
  }, [content, contentRef]);

  const memoizedEmbeds = useMemo(() => embeds, [embeds]);

  return (
    <section className="mt-1">
      {memoizedEmbeds.map((v, i) => (<Embed data={v} key={i} />))}
    </section>
  );
}, (prev, next) => prev.content === next.content);

EmbedRenderer.displayName = 'EmbedRenderer';

const MessageEntry = memo(({ message, channel, editingMessage }: { message: Message; channel: Channel; editingMessage?: Message | null }) => {
  const [val, forceUpdate] = useReducer((v) => v + 1, 0);
  const contentRef = createRef<HTMLDivElement>();

  useEffect(() => {
    const listener = () => forceUpdate();

    channel.events.on(`message-${message.id}`, listener);

    return () => {
      channel.events.off(`message-${message.id}`, listener);
    };
  }, [message, channel]);

  const user = useAsync(() => firebaseClient.managers.user.fetch(message.author), [message.author]);

  useLayoutEffect(() => {
    if (contentRef.current && message) {
      contentRef.current.innerHTML = message.content;
      highlightElement(contentRef.current);
    }
  }, [message, contentRef, val]);

  return (
    <section id={message.id} className={['group relative px-6 py-1 flex items-start gap-4', editingMessage?.id === message.id ? 'bg-cloudy-500 bg-opacity-50' : 'hover:bg-cloudy-700 hover:bg-opacity-50'].join(' ')}>
      <ActionPopOver message={message} />

      <img src={user.value?.image} alt="" className="w-12 rounded-full" />

      <section className="flex-grow">
        <section className="flex gap-3 items-end mb-[2px]">
          <h3 className="font-extrabold">{user.value?.name}</h3>

          {message.createdAt && (
            <p className="text-cloudy-300 text-sm">
              <span className="capitalize">{DateTime.fromJSDate(message.createdAt).toRelativeCalendar()}</span>
              {' at '}
              <span className="capitalize">{DateTime.fromJSDate(message.createdAt).toFormat('HH:mm')}</span>
            </p>
          )}
        </section>

        <section className="flex-grow">
          <section
            ref={contentRef}
            className="user_message break-all whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />

          {message.editedAt && <EditedMark editedAt={message.editedAt} />}
        </section>

        <EmbedRenderer contentRef={contentRef} content={message.content} />

        {message.attachments?.length && <Attachments attachments={message.attachments} />}
      </section>
    </section>
  );
});

MessageEntry.displayName = 'MessageEntry';

const HeadlessMessageEntry = memo(({ message, channel, editingMessage }: { message: Message; channel: Channel; editingMessage?: Message | null }) => {
  const [val, forceUpdate] = useReducer((v) => v + 1, 0);
  const contentRef = createRef<HTMLDivElement>();

  useEffect(() => {
    const listener = () => forceUpdate();

    channel.events.on(`message-${message.id}`, listener);

    return () => {
      channel.events.off(`message-${message.id}`, listener);
    };
  }, [message, channel, forceUpdate]);

  useLayoutEffect(() => {
    if (contentRef.current && message) {
      contentRef.current.innerHTML = message.content;
      highlightElement(contentRef.current);
    }
  }, [message, contentRef, val]);

  return (
    <section id={message.id} className={['group relative px-6 py-1 flex gap-4 items-center', editingMessage?.id === message.id ? 'bg-cloudy-500 bg-opacity-50' : 'hover:bg-cloudy-700 hover:bg-opacity-50'].join(' ')}>
      <ActionPopOver message={message} />

      <section className="w-12 flex items-center justify-center h-full select-none">
        <p className="text-xs text-cloudy-400 hidden group-hover:block">{DateTime.fromJSDate(message.createdAt).toFormat('HH:mm')}</p>
      </section>

      <section className="flex-grow">
        <section>
          <section
            ref={contentRef}
            className="user_message break-all whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />

          {message.editedAt && <EditedMark editedAt={message.editedAt} />}
        </section>

        <EmbedRenderer contentRef={contentRef} content={message.content} />

        {message.attachments?.length && <Attachments attachments={message.attachments} />}
      </section>
    </section>
  );
});

HeadlessMessageEntry.displayName = 'HeadlessMessageEntry';

const Messages = ({ channel }: { channel?: Channel | null }) => {
  const editingMessage = useEditMessage((s) => s.message);
  const lockScroll = useRef<boolean>(true);
  const messagesRef = createRef<HTMLDivElement>();
  const [coupledMessages, setCoupledMessages] = useState<Message[][]>([]);

  const onScroll: UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    const maxScroll = el.scrollHeight - el.offsetHeight;
    const val = maxScroll - el.scrollTop < 50;

    if (lockScroll.current === val) return;

    lockScroll.current = val;
  };

  useEffect(() => {
    if (!channel) return;

    const listener = () => {
      setCoupledMessages(coupleMessages(channel.messages));
    };

    channel.events.on('message', listener);

    return () => {
      channel.events.off('message', listener);
    };
  }, [channel]);

  useLayoutEffect(() => {
    if (!messagesRef.current) return;
    if (!lockScroll.current) return;

    messagesRef.current.scrollTo(0, messagesRef.current.scrollHeight);
  });

  return (
    <section ref={messagesRef} onScroll={onScroll} className="flex-grow gap-4 flex flex-col overflow-y-auto custom_scrollbar mr-1 mt-1">
      <section className="min-h-[300px] flex-grow flex flex-col opacity-50 items-center justify-center">
        <FontAwesomeIcon
          icon={faUserPen}
          size="6x"
          className="mb-4"
        />

        <h3 className="font-bold text-xl">This is the beginning...</h3>
      </section>

      {channel && coupledMessages && coupledMessages.map((messages, k) => (
        <section key={k}>
          {messages.map((message, i) => {
            if (i === 0) {
              return (<MessageEntry editingMessage={editingMessage} key={message.id} message={message} channel={channel} />);
            }

            return <HeadlessMessageEntry editingMessage={editingMessage} key={message.id} message={message} channel={channel} />;
          })}
        </section>
      ))}
    </section>
  );
};

export default Messages;