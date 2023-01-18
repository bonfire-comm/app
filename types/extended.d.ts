import { UserRecord } from 'firebase-admin/lib/auth/user-record';

declare module 'next' {
  interface NextApiRequest {
    user?: UserRecord;
  }
}