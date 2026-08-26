import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createBugForgeApp } from "../server/_core/app";
import { restoreVercelApiPath } from "../server/_core/vercelRoute";

// Vercel discovers this catch-all file as a Node serverless function. The
// Express app is shared with the managed runtime, but never calls listen() here.
const app = createBugForgeApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  const restoredPath = restoreVercelApiPath(req.url, req.query.path);
  if (restoredPath) req.url = restoredPath;
  return app(req, res);
}
