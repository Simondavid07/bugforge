import type { User } from "../../drizzle/schema.js";
import { authenticateRequest } from "./supabaseAuth.js";

type ExpressContextOptions = {
  req: any;
  res: any;
};

export type TrpcContext = {
  req: any;
  res: any;
  user: User | null;
};

export async function createContext(
  opts: ExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
