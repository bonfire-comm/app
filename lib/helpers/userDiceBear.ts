
import { useEffect, useState } from 'react';
import generateAvatar from './generateAvatar';

export default function useDiceBear(name: string) {
  const [pict, setPict] = useState<null | string>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const avatar = await generateAvatar();

      if (active) {
        setPict(avatar);
      }
    })();

    return () => {
      active = false;
    };
  }, [name]);

  return pict;
}