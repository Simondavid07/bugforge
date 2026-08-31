import * as db from "../db.js";
import { ENV } from "./env.js";

type SupabaseIdentity = {
  provider?: string;
  identity_data?: {
    email?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    user_name?: string;
    avatar_url?: string;
  };
  identities?: SupabaseIdentity[];
};

type AuthenticatedRequest = {
  headers: {
    authorization?: string | string[];
  };
};

function bearerToken(req: AuthenticatedRequest) {
  const header = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  return typeof header === "string" && header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : null;
}

async function getSupabaseUser(accessToken: string): Promise<SupabaseAuthUser> {
  const response = await fetch(`${ENV.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: ENV.supabasePublishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Supabase Auth rejected the access token (${response.status})`
    );
  }

  return (await response.json()) as SupabaseAuthUser;
}

function profileName(user: SupabaseAuthUser) {
  const metadata = user.user_metadata ?? {};
  const identity = user.identities?.find(item => item.provider === "github");
  return (
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    identity?.identity_data?.full_name ||
    identity?.identity_data?.name ||
    user.email ||
    "GitHub member"
  );
}

function profileAvatar(user: SupabaseAuthUser) {
  const metadata = user.user_metadata ?? {};
  const identity = user.identities?.find(item => item.provider === "github");
  return metadata.avatar_url || identity?.identity_data?.avatar_url || null;
}

export async function authenticateRequest(req: AuthenticatedRequest) {
  const accessToken = bearerToken(req);
  if (!accessToken) throw new Error("Missing Supabase access token");

  if (accessToken.startsWith("demo:")) {
    const personaKey = accessToken.slice(5).trim();
    return await db.ensureDemoPersonaUser(personaKey);
  }

  const authUser = await getSupabaseUser(accessToken);
  if (!authUser.id) throw new Error("Supabase user id is missing");

  const email =
    typeof authUser.email === "string" ? authUser.email.toLowerCase() : null;
  const githubOpenId = `github:${authUser.id}`;
  let user = await db.getUserByOpenId(githubOpenId);

  // Preserve an existing BugForge account and all of its memberships when the
  // trusted, provider-confirmed GitHub email matches that account.
  if (!user && email && authUser.email_confirmed_at) {
    user = await db.getUserByEmail(email);
  }

  const openId = user?.openId ?? githubOpenId;
  await db.upsertUser({
    openId,
    name: profileName(authUser),
    email,
    loginMethod: "github",
    // A provider avatar only seeds new BugForge accounts. Existing accounts may
    // have a user-selected private image marker, which must not be replaced by
    // concurrent or subsequent GitHub profile synchronizations.
    ...(user ? {} : { avatarUrl: profileAvatar(authUser) }),
    lastSignedIn: new Date(),
  });

  const persistedUser = await db.getUserByOpenId(openId);
  if (!persistedUser) throw new Error("GitHub user could not be persisted");
  return persistedUser;
}
