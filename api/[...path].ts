import type { VercelRequest, VercelResponse } from "@vercel/node";
import { restoreVercelApiPath } from "../server/_core/vercelRoute";

// Vercel discovers this catch-all file as a Node serverless function. The
// Express app is shared with the managed runtime, but never calls listen() here.
let appPromise: Promise<ReturnType<typeof import("../server/_core/app")["createBugForgeApp"]>> | undefined;

function getApp() {
  appPromise ??= import("../server/_core/app").then(({ createBugForgeApp }) =>
    createBugForgeApp(),
  );
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const restoredPath = restoreVercelApiPath(req.url, req.query.path);
    if (restoredPath) req.url = restoredPath;
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error("[Vercel] Unable to initialize BugForge API handler", error);
    return res.status(500).json({ error: "BugForge API is temporarily unavailable" });
  }
}
