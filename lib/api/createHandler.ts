/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next';
import nc, { Middleware } from 'next-connect';
import middlewares from './middlewares';

export default function createApiHandler<T = any>(useMiddlewares: (keyof typeof middlewares | Middleware<NextApiRequest, NextApiResponse>)[] = []) {
  const handler = nc<NextApiRequest, NextApiResponse<SemanticResponse<T>>>({
    onError: (err, req, res) => {
      res.status(500).json({ message: 'Something broke!' });
    },
    onNoMatch: (req, res) => {
      res.status(404).json({ message: 'Page is not found' });
    },
  });

  useMiddlewares.forEach((middleware) => {
    if (typeof middleware === 'string') {
      const resolve = middlewares[middleware];
      if (!resolve) return;

      handler.use(resolve);
    }

    if (typeof middleware === 'function') handler.use(middleware);
  });

  return handler;
}