/**
 * Vercel rewrites every API request to the physical catch-all function path.
 * Express/tRPC still needs the original API pathname to select the correct
 * router, so restore it before dispatching the request to the shared app.
 */
export function restoreVercelApiPath(requestUrl: string | undefined, matchedPath: unknown) {
  const path = Array.isArray(matchedPath) ? matchedPath.join("/") : matchedPath;
  if (typeof path !== "string" || path.length === 0) return requestUrl;

  const url = new URL(requestUrl ?? "/", "http://bugforge.local");
  if (url.pathname !== "/api/[...path]") return requestUrl;

  url.pathname = `/api/${path.replace(/^\/+/, "")}`;
  url.searchParams.delete("path");
  return `${url.pathname}${url.search}`;
}
