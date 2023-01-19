import createApiHandler from '@/lib/api/createHandler';
import admin from '@/lib/firebase/admin';

const firestore = admin.firestore();
const collection = firestore.collection('users');

export default createApiHandler<UserOptions>()
  .get(async (req, res) => {
    const id = req.query.id as string;

    try {
      const current = await collection
        .doc(id)
        .get();

      if (!current.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      const authUser = await admin.auth().getUser(id);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const data = current.data()!;

      return res.status(200).json({
        payload: {
          ...(data as UserOptions),
          createdAt: data.createdAt.toDate(),
          name: authUser.displayName as string,
          image: authUser.photoURL
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return res.status(500).json({ errors: err?.message });
    }
  });