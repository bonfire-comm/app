/* eslint-disable @next/next/no-img-element */
import Channel from '@/lib/classes/channel';
import Message from '@/lib/classes/message';
import firebaseClient from '@/lib/firebase';
import coupleMessages from '@/lib/helpers/coupleMessages';
import download from '@/lib/helpers/download';
import useEditMessage from '@/lib/store/editMessage';
import { faDownload, faFile, faIdCard, faPencil, faTrash, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@mantine/core';
import { IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useClipboard } from '@mantine/hooks';
import { toHtml } from 'hast-util-to-html';
import { lowlight } from 'lowlight';
import { DateTime } from 'luxon';
import { useReducer, createRef, useEffect, useLayoutEffect, useRef, UIEventHandler, useMemo, Fragment } from 'react';
import { useAsync } from 'react-use';

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

const MessageEntry = ({ message, channel }: { message: Message; channel: Channel }) => {
  const editingMessage = useEditMessage((state) => state.message);
  const [val, forceUpdate] = useReducer((v) => v + 1, 0);
  const contentRef = createRef<HTMLDivElement>();

  useEffect(() => {
    const listener = () => forceUpdate();

    channel.events.on(`message-${message.id}`, listener);

    return () => {
      channel.events.off(`message-${message.id}`, listener);
    };
  }, [message, channel, forceUpdate]);

  const user = useAsync(() => firebaseClient.managers.user.fetch(message.author), [message.author]);

  useLayoutEffect(() => {
    if (contentRef.current && message) {
      contentRef.current.innerHTML = message.content;

      const els = contentRef.current.querySelectorAll<HTMLElement>('pre code');
      els.forEach((el) => {
        const lang = el.className.split('-')[1];
        const tree = lowlight.highlight(lang, el.innerHTML.trim());
        const html = toHtml(tree);

        el.classList.add('hljs');
        // eslint-disable-next-line no-param-reassign
        el.innerHTML = html;
      });
    }
  }, [message, contentRef, val]);

  return (
    <section className={['group relative px-6 py-1 flex items-start gap-4', editingMessage?.id === message.id ? 'bg-cloudy-500 bg-opacity-50' : 'hover:bg-cloudy-700 hover:bg-opacity-50'].join(' ')}>
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

        {message.attachments?.length && <Attachments attachments={message.attachments} />}
      </section>
    </section>
  );
};

const HeadlessMessageEntry = ({ message, channel }: { message: Message; channel: Channel }) => {
  const editingMessage = useEditMessage((state) => state.message);
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

      const els = contentRef.current.querySelectorAll<HTMLElement>('pre code');
      els.forEach((el) => {
        const lang = el.className.split('-')[1];
        const tree = lowlight.highlight(lang, el.innerHTML.trim());
        const html = toHtml(tree);

        el.classList.add('hljs');
        // eslint-disable-next-line no-param-reassign
        el.innerHTML = html;
      });
    }
  }, [message, contentRef, val]);

  return (
    <section className={['group relative px-6 py-1 flex gap-4 items-center', editingMessage?.id === message.id ? 'bg-cloudy-500 bg-opacity-50' : 'hover:bg-cloudy-700 hover:bg-opacity-50'].join(' ')}>
      <ActionPopOver message={message} />

      <section className="w-12 flex items-center justify-center h-full select-none">
        <p className="text-xs text-cloudy-400 hidden group-hover:block">{DateTime.fromJSDate(message.createdAt).toFormat('HH:mm')}</p>
      </section>

      <section>
        <section
          ref={contentRef}
          className="user_message break-all whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: message.content }}
        />

        {message.editedAt && <EditedMark editedAt={message.editedAt} />}
      </section>

      {message.attachments?.length && <Attachments attachments={message.attachments} />}
    </section>
  );
};

const Messages = ({ channel }: { channel?: Channel | null }) => {
  const [updateCount, forceUpdate] = useReducer((v) => v + 1, 0);
  const lockScroll = useRef<boolean>(true);
  const messagesRef = createRef<HTMLDivElement>();

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
      forceUpdate();
    };

    channel.events.on('message', listener);

    return () => {
      channel.events.off('message', listener);
    };
  }, [channel, forceUpdate]);

  const lastHeight = useRef<number>(0);

  useEffect(() => {
    if (!messagesRef.current) return;

    const observeTarget = messagesRef.current;
    const resizeObserver = new ResizeObserver(() => {
      if (observeTarget.clientHeight !== lastHeight.current && lockScroll) {
        observeTarget.scrollTo(0, observeTarget.scrollHeight);
      }

      lastHeight.current = observeTarget.clientHeight;
    });

    resizeObserver.observe(observeTarget);

    return () => {
      resizeObserver.disconnect();
    };
  }, [messagesRef, lockScroll]);

  useLayoutEffect(() => {
    if (!messagesRef.current) return;
    if (!lockScroll.current) return;

    messagesRef.current.scrollTo(0, messagesRef.current.scrollHeight);
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const coupledMessages = useMemo(() => channel && coupleMessages(channel.messages), [channel, updateCount]);

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
              return (<MessageEntry key={message.id} message={message} channel={channel} />);
            }

            return <HeadlessMessageEntry key={message.id} message={message} channel={channel} />;
          })}
        </section>
      ))}
    </section>
  );
};

export default Messages;