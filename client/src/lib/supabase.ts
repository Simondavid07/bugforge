import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://zznvjtdspjampmztrunx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_8Gj1KX5UM7S1A2VbyAdFwg_UYYJhYbg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // AuthCallback.tsx performs the explicit PKCE exchange exactly once.
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

const DEMO_PERSONA_STORAGE_KEY = "bugforge_demo_token";
let accessToken: string | null = null;

export function setSupabaseAccessToken(token: string | null) {
  accessToken = token;
}

export function setDemoPersonaToken(personaKey: string | null) {
  if (typeof window !== "undefined") {
    if (personaKey) {
      localStorage.setItem(DEMO_PERSONA_STORAGE_KEY, `demo:${personaKey}`);
      accessToken = `demo:${personaKey}`;
    } else {
      localStorage.removeItem(DEMO_PERSONA_STORAGE_KEY);
      accessToken = null;
    }
  }
}

export function getActiveDemoPersona(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(DEMO_PERSONA_STORAGE_KEY);
  return stored && stored.startsWith("demo:") ? stored.slice(5) : null;
}

export function getSupabaseAccessToken() {
  if (typeof window !== "undefined") {
    const demo = localStorage.getItem(DEMO_PERSONA_STORAGE_KEY);
    if (demo) return demo;
  }
  return accessToken;
}

