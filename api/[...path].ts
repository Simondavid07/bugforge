import { createBugForgeApp } from "../server/_core/app";

// Vercel discovers this catch-all file as a serverless function. It deliberately
// exports an Express handler and never calls listen(), so every invocation can be
// managed by Vercel’s Node runtime.
export default createBugForgeApp();
