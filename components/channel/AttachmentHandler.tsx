/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { faUpload, faFileAudio, faFile, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LoadingOverlay } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { MutableRefObject } from 'react';

interface DropAreaProps {
  onDrop: (files: File[]) => void;
  openRef?: MutableRefObject<() => void>;
}

export const DropArea = ({ onDrop, openRef }: DropAreaProps) => (
  <Dropzone.FullScreen
    onDrop={onDrop}
    openRef={openRef}
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

export const AttachmentPreview = ({ attachment, onRemove }: { attachment: File; onRemove?: () => any }) => {
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

export default Attachments;