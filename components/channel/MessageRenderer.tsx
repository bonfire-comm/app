/* eslint-disable @next/next/no-img-element */
import Channel from '@/lib/classes/channel';
import Message from '@/lib/classes/message';
import firebaseClient from '@/lib/firebase';
import coupleMessages from '@/lib/helpers/coupleMessages';
import download from '@/lib/helpers/download';
import fetchEmbed from '@/lib/helpers/fetchEmbed';
import useMessageAction from '@/lib/store/messageAction';
import { faArrowRight, faDownload, faFile, faIdCard, faPencil, faReply, faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@mantine/core';
import { IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useClipboard } from '@mantine/hooks';
import { DateTime } from 'luxon';
import { useReducer, createRef, useEffect, useLayoutEffect, useRef, UIEventHandler, RefObject, useState, useMemo, memo } from 'react';
import { useAsync } from 'react-use';
import { uniq } from 'lodash-es';
import highlightElement from '@/lib/helpers/highlightElement';
import openProfileModal from '@/lib/helpers/openProfileModal';
import sleep from '@/lib/helpers/sleep';
import truncate from '@/lib/helpers/truncate';
import useProxyURL from '@/lib/helpers/useProxyURL';
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
      <span onClick={() => useMessageAction.setState({ replying: true, editing: false, message })} className="cursor-pointer p-2 hover:bg-cloudy-600">
        <FontAwesomeIcon icon={faReply} size="sm" />
      </span>

      {message.author === firebaseClient.auth.currentUser?.uid && (
        <>
          <span onClick={() => useMessageAction.setState({ editing: true, replying: false, message })} className="cursor-pointer p-2 hover:bg-cloudy-600">
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

const ReplyIndicator = ({ message, channel }: { message: Message; channel: Channel }) => {
  const replyTo = useAsync(async () => {
    if (!message.replyTo) return null;

    return channel.fetchMessage(message.replyTo);
  }, [message.replyTo]);

  const user = useAsync(async () => {
    if (!replyTo.value) return null;

    const u = await firebaseClient.managers.user.fetch(replyTo.value.author);

    return u;
  }, [replyTo.value]);

  const content = useMemo(() => {
    const temp = document.createElement('div');

    temp.innerHTML = replyTo.value?.content ?? '';

    return truncate(temp.innerText);
  }, [replyTo.value]);

  const scrollToView = async () => {
    if (!replyTo.value) return;

    const container = document.querySelector('#messages_container') satisfies HTMLDivElement | null;
    const el = document.querySelector(`#${replyTo.value.id}`) satisfies HTMLDivElement | null;
    if (!el || !container) return;

    container.scrollTo({
      behavior: 'smooth',
      top: el.offsetTop - container.offsetTop - 100,
    });

    await sleep(300);

    el.classList.add('bg-cloudy-500');

    await sleep(1000);

    el.classList.remove('bg-cloudy-500');
  };

  return (
    <section className="flex gap-4 mb-3 opacity-50">
      <span className="flex items-center justify-center w-12">
        <FontAwesomeIcon icon={faArrowRight} />
      </span>

      <section className="flex gap-3">
        <section className="flex gap-2">
          <img src={user.value?.image} alt="" className="w-6 rounded-full aspect-square" />
          <h4 className="font-bold">{user.value?.name}</h4>
        </section>

        <p className="cursor-pointer whitespace-nowrap break-keep text-ellipsis" onClick={scrollToView}>{content}</p>
      </section>
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
    <section className="mt-1 flex flex-col gap-3">
      {memoizedEmbeds.map((v, i) => (<Embed data={v} key={i} />))}
    </section>
  );
}, (prev, next) => prev.content === next.content);

EmbedRenderer.displayName = 'EmbedRenderer';

const MessageEntry = memo(({ message, channel, editingMessage }: { message: Message; channel: Channel; editingMessage?: Message | null }) => {
  const [val, forceUpdate] = useReducer((v) => v + 1, 0);
  const contentRef = createRef<HTMLDivElement>();
  const createdTime = useMemo(() => DateTime.fromJSDate(message.createdAt), [message]);

  useEffect(() => {
    const listener = () => forceUpdate();

    channel.events.on(`message-${message.id}`, listener);

    return () => {
      channel.events.off(`message-${message.id}`, listener);
    };
  }, [message, channel]);

  const user = useAsync(() => firebaseClient.managers.user.fetch(message.author), [message]);

  const openProfile = () => {
    if (user.value) {
      openProfileModal(user.value);
    }
  };

  useLayoutEffect(() => {
    if (contentRef.current && message) {
      contentRef.current.innerHTML = message.content;
      highlightElement(contentRef.current);
    }
  }, [message, contentRef, val]);

  return (
    <section id={message.id} className={['group relative px-6 py-1 transition-colors ease-out duration-200', editingMessage?.id === message.id ? 'bg-cloudy-500 bg-opacity-50' : 'hover:bg-cloudy-700 hover:bg-opacity-50'].join(' ')}>
      {message.replyTo && <ReplyIndicator message={message} channel={channel} />}

      <ActionPopOver message={message} />

      <section className="flex items-start gap-4">
        <img onClick={openProfile} src={useProxyURL(user.value?.image)} alt="" className="w-12 rounded-full cursor-pointer" />

        <section className="flex-grow">
          <section className="flex gap-3 items-end mb-[2px]">
            <h3 onClick={openProfile} className="font-extrabold hover:underline hover:underline-offset-1 cursor-pointer">{user.value?.name}</h3>

            {message.createdAt && (
              <p className="text-cloudy-300 text-sm">
                {DateTime.local().diff(createdTime, 'days').days < 1
                  ? (
                    <>
                      <span className="capitalize">{createdTime.toRelativeCalendar()}</span>
                      {' at '}
                    </>
                  )
                  : `${createdTime.toLocaleString(DateTime.DATE_SHORT) } `
                }
                <span className="capitalize">{createdTime.toLocaleString(DateTime.TIME_SIMPLE)}</span>
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
    </section>
  );
}, (prev, next) => prev.message.id === next.message.id && prev.editingMessage?.id === next.editingMessage?.id);

MessageEntry.displayName = 'MessageEntry';

const HeadlessMessageEntry = memo(({ message, channel, editingMessage }: { message: Message; channel: Channel; editingMessage?: Message | null }) => {
  const [val, forceUpdate] = useReducer((v) => v + 1, 0);
  const contentRef = createRef<HTMLDivElement>();
  const createdTime = useMemo(() => DateTime.fromJSDate(message.createdAt), [message]);

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
    <section id={message.id} className={['group relative px-6 py-1 flex gap-4 items-center transition-colors ease-out duration-200', editingMessage?.id === message.id ? 'bg-cloudy-500 bg-opacity-50' : 'hover:bg-cloudy-700 hover:bg-opacity-50'].join(' ')}>
      <ActionPopOver message={message} />

      <section className="w-12 flex items-center justify-center h-full select-none flex-shrink-0">
        <p className="text-xs text-cloudy-400 hidden group-hover:block whitespace-nowrap">{createdTime.toLocaleString(DateTime.TIME_SIMPLE)}</p>
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
}, (prev, next) => prev.message.id === next.message.id && prev.editingMessage?.id === next.editingMessage?.id);

HeadlessMessageEntry.displayName = 'HeadlessMessageEntry';

const Messages = ({ channel }: { channel?: Channel | null }) => {
  const editingMessage = useMessageAction((s) => s.message);
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
    <section id="messages_container" ref={messagesRef} onScroll={onScroll} className="flex-grow gap-4 flex flex-col overflow-y-auto custom_scrollbar mr-1 mt-1">
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