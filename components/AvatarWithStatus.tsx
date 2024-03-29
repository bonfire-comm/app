/* eslint-disable @next/next/no-img-element */
import { Indicator } from '@mantine/core';

interface Props {
  image: string;
  status: UserStatus;
  indicatorSize?: number;
  className?: string;
  imageSize?: number;
}

const getColorByStatus = (status: UserStatus) => {
  switch (status) {
    case 'online':
      return 'green';

    case 'offline':
      return 'gray';

    case 'idle':
      return 'yellow';

    default: return 'red';
  }
};

export default function AvatarWithStatus({ image, imageSize = 48, status, indicatorSize = 20, className }: Props) {
  return (
    <Indicator dot size={indicatorSize} position="bottom-end" offset={5} classNames={{ indicator: `border-[3px] border-cloudy-500 ${status === 'offline' && 'bg-zinc-500'}` }} color={getColorByStatus(status)}>
      <img width={imageSize} className={['rounded-full h-auto', className].filter(Boolean).join(' ')} src={image} alt="Avatar" />
    </Indicator>
  );
}