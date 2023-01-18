import axios from 'axios';
// eslint-disable-next-line import/no-cycle
import firebaseClient from '../firebase';

const fetcher = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

fetcher.interceptors.request.use(async (config) => {
  const token = await firebaseClient.auth.currentUser?.getIdToken(true);

  if (token) {
    if (config.headers) {
      // @ts-expect-error it is what it is
      config.headers.Authorization = token; // eslint-disable-line no-param-reassign
    }
  }

  return config;
});

export default fetcher;