import { croodlesNeutral } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';

export default async function generateAvatar(size?: number, name?: string | null) {
  const avatar = await createAvatar(croodlesNeutral, {
    size: size || 64,
    seed: name ?? (Math.random() * 999999999).toString(),
    backgroundColor: [
      'b6e3f4',
      'c0aede',
      'd1df49',
      'ffd5dc'
    ]
  }).toDataUri();

  return avatar;
}