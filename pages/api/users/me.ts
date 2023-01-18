import createApiHandler from '@/lib/api/createHandler';
import admin from '@/lib/firebase/admin';
import { User } from 'firebase/auth';
import { z } from 'zod';

const firestore = admin.firestore();

const patchValidator = z.object({
  name: z.string().min(3).max(24).optional(),
  image: z.string().url().nullable().optional()
});

const checkUserWithSimilarData = (name: string, discriminator: number) => admin
  .firestore()
  .collection('users')
  .where('name', '==', name)
  .where('discriminator', '==', discriminator)
  .limit(1)
  .get();

export default createApiHandler<User>(['verifyFireauth'])
  .get(async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const collection = firestore.collection('users');

    try {
      const current = await collection
        .doc(req.user.uid)
        .get();

      if (!current.exists) {
        const { uid, email, displayName, photoURL } = req.user;
        const userEntry = {
          id: uid,
          name: displayName ?? null,
          email,
          discriminator: Math.floor(Math.random() * 8999) + 1000,
          image: photoURL ?? null,
          banner: null,
          about: null,
          badges: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await collection.doc(uid).set(userEntry);
      }

      return res.status(200).json({
        payload: (await current.ref.get()).data() as User
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return res.status(500).json({ errors: err?.message });
    }
  })
  .post(async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const parsed = patchValidator.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid body', errors: parsed.error });
    }

    const body = {
      ...parsed.data
    } as typeof patchValidator['_output'] & {[key: string]: unknown};

    try {
      const current = await firestore
        .collection('users')
        .doc(req.user.uid)
        .get();

      if (!current.exists) {
        return res.status(400).json({ message: 'User does not exist' });
      }

      if (body.name) {
        let count = 0;

        while (count < 3) {
          // eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-non-null-assertion
          const trying = await checkUserWithSimilarData(body.name, body.discriminator ?? current.data()!.discriminator);

          if (!trying.empty) {
            body.discriminator = Math.floor(Math.random() * 8999) + 1000;
            count += 1;

            // eslint-disable-next-line no-continue
            continue;
          }

          break;
        }
      }

      await current
        .ref
        .update(body);

      await admin.auth().updateUser(req.user.uid, {
        displayName: body.name,
        photoURL: body.image
      });

      return res.status(200).json({
        payload: (await current.ref.get()).data() as User
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return res.status(500).json({ errors: err?.message });
    }
  });