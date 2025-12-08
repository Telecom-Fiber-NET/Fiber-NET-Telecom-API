// api/src/types/express.d.ts
import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      ids?: string[];
      // Add other properties of the user object if they exist
    };
  }
}
