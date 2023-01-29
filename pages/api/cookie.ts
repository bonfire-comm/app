import { cookieManagerValidator } from '@/components/TokenCookieProvider';
import createApiHandler from '@/lib/api/createHandler';
import nookies from 'nookies';

export default createApiHandler()
  .post(async (req, res) => {
    const parsed = cookieManagerValidator.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({
      errors: parsed.error.errors
    });

    const { set, remove } = parsed.data;

    if (remove) {
      remove.forEach((key) => {
        const [value, path] = key.split(':');
        nookies.destroy({ res }, value as string, {
          path
        });
      });
    }

    if (set) {
      Object.entries(set).forEach(([key, opt]) => {
        nookies.set({ res }, key, opt.value, opt.options);
      });
    }

    return res.status(200).json({
      payload: {
        set,
        remove
      }
    });
  });