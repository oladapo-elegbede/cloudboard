import type { AccessTokenPayload } from "./token.types.js";
import type { Membership } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      membership?: Membership;
    }
  }
}

export {};
