import getUserFromToken from './getUserFromToken';

const guestServerProps = (handler?: GetServerSidePropsWithUser) => {
  const internalHandler: GetServerSidePropsWithUser = async (ctx) => {
    const { token } = ctx.req.cookies;
    const validated = token ? await getUserFromToken(token).catch(() => false) : false;

    if (token && validated) {
      return {
        redirect: {
          permanent: true,
          destination: '/app'
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

export default guestServerProps;