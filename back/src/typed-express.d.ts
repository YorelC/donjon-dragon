import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export {};
