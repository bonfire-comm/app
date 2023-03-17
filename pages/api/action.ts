import createApiHandler from '@/lib/api/createHandler';

export default createApiHandler()
  .get(async (req, res) => {
    const { mode, ...rest } = req.query;

    switch(mode) {
      case 'resetPassword':
        return res.redirect(`/reset?${new URLSearchParams(Object.entries(rest) as [string, string][]).toString()}`);

      case 'verifyEmail': {
        return res.redirect(`/verify?${new URLSearchParams(Object.entries(rest) as [string, string][]).toString()}`);
      }

      default:
        return res.status(200).json({ message: 'Unknown action' });
    }
  });