/* eslint-disable @next/next/no-img-element */
import 'react-image-crop/dist/ReactCrop.css';

import { noop } from '@mantine/utils';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import ReactCrop, { Crop, ReactCropProps } from 'react-image-crop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faPencil, faUpload, faXmark } from '@fortawesome/free-solid-svg-icons';
import { createRef, useEffect, useMemo, useState } from 'react';
import centerAspectCrop from '@/lib/helpers/centerAspectRatio';
import { Button } from '@mantine/core';
import { useClickOutside, useToggle } from '@mantine/hooks';

const RESIZE_SIZE = 512;

interface Props extends Omit<ReactCropProps, 'onChange'> {
  src?: string | null;
  enableCropping?: boolean;
  onChange?: (image: File) => void;
  onCrop?: (crop: Crop) => void;
  onPick?: (image: File | Blob | null) => void;
}

export default function ImagePicker({ src: initialSrc, enableCropping, onChange = noop, onCrop = noop, onPick = noop, ...props }: Props) {
  const [isDirty, setDirty] = useToggle();
  const [src, setSrc] = useState<string | null | undefined>(null);

  useEffect(() => {
    if (isDirty) return;

    setSrc(initialSrc);
  }, [initialSrc, isDirty]);

  const [cropped, setCropped] = useState(false);
  const [crop, setCrop] = useState<Crop | undefined>();
  const [selected, setSelected] = useState<File | Blob | null>(null);
  const [originalSelected, setOriginalSelected] = useState<File | Blob | null>(null);

  const selectedUri = useMemo(() => {
    if (!selected) {
      return null;
    }

    return URL.createObjectURL(selected);
  }, [selected]);

  const imageRef = createRef<HTMLImageElement>();

  const processCrop = () => {
    if (cropped) return;

    const image = imageRef.current;
    if (!image || !crop) return;

    const canvas = document.createElement('canvas');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = canvas.getContext('2d')!;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    // devicePixelRatio slightly increases sharpness on retina devices
    // at the expense of slightly slower render times and needing to
    // size the image back down if you want to download/upload and be
    // true to the images natural size.
    const pixelRatio = window.devicePixelRatio;

    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();

    // 5) Move the crop origin to the canvas origin (0,0)
    ctx.translate(-cropX, -cropY);
    // 4) Move the origin to the center of the original position
    ctx.translate(centerX, centerY);
    // 1) Move the center of the image to the origin (0,0)
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
    );

    ctx.restore();

    const canvas2 = document.createElement('canvas');
    canvas2.width = RESIZE_SIZE;
    canvas2.height = RESIZE_SIZE;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx2 = canvas2.getContext('2d')!;

    // resize blob to 1024x1024
    ctx2.imageSmoothingQuality = 'high';
    ctx2.drawImage(canvas, 0, 0, RESIZE_SIZE, RESIZE_SIZE);

    canvas2.toBlob((blob) => {
      if (!blob) return;

      setSelected(blob);
      setCropped(true);

      onPick(blob);
    }, 'image/webp');
  };

  const removePick = () => {
    setCrop(undefined);
    setSelected(null);
    onPick(null);
    setDirty(true);
    setSrc(null);
  };

  const enableEditing = () => {
    setSelected(originalSelected);
    setCropped(false);
  };

  useEffect(() => {
    if (!selectedUri) return;

    return () => {
      URL.revokeObjectURL(selectedUri);
    };
  }, [selectedUri]);

  const clickOutsideRef = useClickOutside(() => processCrop());

  if (src || (!src && !selectedUri) || !enableCropping || cropped) {
    return (
      <section className="relative flex-grow">
        <section className="z-10 absolute top-3 right-3 flex gap-2">
          {selected && (
            <span
              className="cursor-pointer w-6 h-6 grid place-items-center bg-cloudy-500 rounded bg-opacity-90 border border-cloudy-500"
              onClick={enableEditing}
            >
              <FontAwesomeIcon
                icon={faPencil}
                size="xs"
              />
            </span>
          )}

          {(src || selectedUri) && (
            <span
              className="cursor-pointer w-6 h-6 grid place-items-center bg-cloudy-500 rounded bg-opacity-90 border border-cloudy-500"
              onClick={removePick}
            >
              <FontAwesomeIcon
                icon={faXmark}
              />
            </span>
          )}
        </section>

        <Dropzone
          onDrop={(files) => {
            onChange(files[0]);
            setSelected(files[0]);
            setCropped(false);
            setDirty(true);
            setSrc(null);

            if (!enableCropping) onPick(files[0]);
          }}
          // onReject={(files) => onReject(files)}
          maxSize={20 * 1024 ** 2}
          accept={IMAGE_MIME_TYPE}
          className="h-full"
          classNames={{
            root: 'hover:bg-cloudy-700 rounded-xl',
            inner: 'h-full flex'
          }}
        >
          <section className="flex-grow flex flex-col text-center gap-4 justify-center items-center">
            {!src && !selected && (
              <>
                <Dropzone.Accept>
                  <FontAwesomeIcon
                    icon={faUpload}
                    size="3x"
                  />
                </Dropzone.Accept>

                <Dropzone.Reject>
                  <FontAwesomeIcon
                    icon={faXmark}
                    size="3x"
                  />
                </Dropzone.Reject>

                <Dropzone.Idle>
                  <FontAwesomeIcon
                    icon={faImage}
                    size="3x"
                  />
                </Dropzone.Idle>

                <section>
                  <p className="font-bold text-lg">Upload image</p>
                  <p>Max. 20 MB</p>
                </section>
              </>
            )}

            {
              (src || selectedUri) && (
                <img
                  src={selectedUri || (src ?? '')}
                  alt="Preview"
                  className={`max-h-fit w-auto object-cover ${props.circularCrop ? 'rounded-full' : ''}`}
                />
              )
            }
          </section>
        </Dropzone>
      </section>
    );
  }

  if (selectedUri && enableCropping && !cropped) {
    return (
      <section className="bg-cloudy-700 rounded-xl overflow-hidden flex-grow flex items-center justify-center relative" ref={clickOutsideRef}>
        <section className="z-10">
          <span
            className="absolute top-3 right-3 cursor-pointer w-6 h-6 grid place-items-center bg-cloudy-500 rounded bg-opacity-70 border border-cloudy-500"
            onClick={removePick}
          >
            <FontAwesomeIcon
              icon={faXmark}
            />
          </span>

          {crop?.width && <Button className="absolute bottom-3 right-3 px-2 py-1 text-base" onClick={processCrop}>Crop</Button>}
        </section>

        <ReactCrop
          {...props}
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => onCrop(c)}
        >
          <img
            ref={imageRef}
            src={selectedUri || (src ?? '')}
            alt="Preview"
            className="select-none max-h-[40rem]"
            onLoad={(ev) => {
              if (!crop && props.aspect) {
                setCrop(centerAspectCrop((ev.target as HTMLImageElement).width, (ev.target as HTMLImageElement).height, props.aspect));
              }

              setOriginalSelected(selected);
            }}
          />
        </ReactCrop>
      </section>
    );
  }

  return null;
}