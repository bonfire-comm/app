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

    ctx.user = user;

    if (!user.displayName && ctx.resolvedUrl !== '/onboarding') {
      return {
        redirect: {
          permanent: true,
          destination: '/onboarding'
        }
      };
    }

    if (!handler) {
      return {
        props: {}
      };
    }

    return handler(ctx);
  };

  return internalHandler;
};

export default authenticatedServerProps;