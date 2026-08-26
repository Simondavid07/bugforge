type RequestWithForwardedHeaders = {
  protocol?: string;
  headers: {
    [key: string]: string | string[] | undefined;
  };
};

export type SessionCookieOptions = {
  domain?: string;
  httpOnly: true;
  path: "/";
  sameSite: "none";
  secure: boolean;
};

function isSecureRequest(req: RequestWithForwardedHeaders) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: RequestWithForwardedHeaders
): SessionCookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none" as const,
    secure: isSecureRequest(req),
  };
}
