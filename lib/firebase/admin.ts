import * as admin from 'firebase-admin';

try {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} catch (error: any) {
  /*
   * We skip the "already exists" message which is
   * not an actual error when we're hot-reloading.
   */
  if (!/already exists/u.test(error?.message)) {
    // eslint-disable-next-line no-console
    console.error('Firebase admin initialization error', error.stack);
  }
}

export default admin;

export const getUserServer = async (id: string): Promise<UserOptions | undefined> => {
  const main = (await admin.firestore().doc(id).get()).data() as UserData | undefined;
  if (!main) return;

  const status = (await admin.database().ref(`statuses/${id}`).get()).val() as UserStatus | undefined ?? 'offline';
  const authUser = await admin.auth().getUser(id);

  return {
    ...main,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: (main.createdAt as any).toDate(),
    name: authUser.displayName as string,
    image: authUser.photoURL,
    status
  };
};