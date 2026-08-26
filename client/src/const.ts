export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

import { supabase } from "@/lib/supabase";

export async function startLogin() {
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo,
      scopes: "read:user user:email",
    },
  });

  if (error) {
    console.error("[GitHub Auth] Unable to start sign-in", error);
    throw error;
  }
}
