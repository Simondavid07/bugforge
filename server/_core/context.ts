import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

type ExpressContextOptions = {
  req: Request;
  res: Response;
};

export type TrpcContext = {
  req: Request;
  res: Response;
  user: User | null;
};
export async function createContext(
  opts: ExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
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
