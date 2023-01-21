import admin from '../firebase/admin';

export default async function getUserFromToken(token: string) {
  const { uid } = await admin.auth().verifyIdToken(token);
  const user = await admin.auth().getUser(uid);

  return user;
}