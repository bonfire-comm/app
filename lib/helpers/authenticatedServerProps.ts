import { Timestamp } from 'firebase/firestore';
import admin from '../firebase/admin';
import getUserFromToken from './getUserFromToken';

const authenticatedServerProps = (handler?: GetServerSidePropsWithUser) => {
  const internalHandler: GetServerSidePropsWithUser = async (ctx) => {
    const { token } = ctx.req.cookies;

    if (!token) {
      return {
        redirect: {
          permanent: true,
          destination: '/login'
        }
      };
    }

    const user = await getUserFromToken(token).catch(() => null);

    if (!user) {
      return {
        redirect: {
          permanent: true,
          destination: '/login'
        }
      };
    }


    const profile = (await admin.firestore()
      .collection('users')
      .doc(user.uid)
      .get()).data() as UserData | undefined;

    if (!profile) {
      return {
        notFound: true
      };
    }

    profile.createdAt = (profile.createdAt as unknown as Timestamp).toDate();

    ctx.user = profile;

    if (!profile?.name && ctx.resolvedUrl !== '/onboarding') {
      return {
        redirect: {
          permanent: true,
          destination: '/onboarding'
        }
      };
    }

    if (!handler) {
      return {
        props: {
          user: JSON.parse(JSON.stringify(profile))
        }
      };
    }

    return handler(ctx);
  };

  return internalHandler;
};

export default authenticatedServerProps;