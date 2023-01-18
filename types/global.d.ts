/* eslint-disable @typescript-eslint/no-explicit-any */
declare interface SemanticResponse<T = any> {
  message?: string;
  code?: string;
  payload?: T;
  errors?: any;
}

declare interface UserData {
  id: string;
  name: string;
  email: string;
  discriminator: number;
  image: string | null;
  banner: string | null;
  about: string | null;
  badges: string[];
  createdAt: Date;
}