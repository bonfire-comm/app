import admin from '../firebase/admin';

export default async function getUserFromToken(token: string) {
  const decodedToken = await admin.auth().verifyIdToken(token);
  const { uid } = decodedToken;
  const user = await admin.auth().getUser(uid);

  return user;
}