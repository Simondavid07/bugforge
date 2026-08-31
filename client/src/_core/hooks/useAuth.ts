import { trpc } from "@/lib/trpc";
import {
  getActiveDemoPersona,
  setDemoPersonaToken,
  setSupabaseAccessToken,
  supabase,
} from "@/lib/supabase";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

const PERSONA_PROFILES: Record<
  string,
  { id: number; name: string; email: string; role: "admin" | "user" }
> = {
  admin: {
    id: 1,
    name: "Marcus Vance (Platform Principal)",
    email: "marcus.vance@bugforge.io",
    role: "admin",
  },
  triage: {
    id: 2,
    name: "Elena Rostova (Triage Director)",
    email: "elena.rostova@bugforge.io",
    role: "user",
  },
  developer: {
    id: 3,
    name: "Devon Wright (Staff Engineer)",
    email: "devon.wright@bugforge.io",
    role: "user",
  },
  viewer: {
    id: 4,
    name: "Sophia Chen (Release Auditor)",
    email: "sophia.chen@bugforge.io",
    role: "user",
  },
};

export function useAuth() {
  const utils = trpc.useUtils();
  const [demoPersona, setDemoPersona] = useState<string | null>(() =>
    getActiveDemoPersona()
  );
  const [sessionReady, setSessionReady] = useState(() =>
    Boolean(getActiveDemoPersona())
  );
  const [signedIn, setSignedIn] = useState(() =>
    Boolean(getActiveDemoPersona())
  );

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: sessionReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const activeDemo = getActiveDemoPersona();
      if (activeDemo) {
        if (!mounted) return;
        setDemoPersona(activeDemo);
        setSignedIn(true);
        setSessionReady(true);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error)
        console.error("[GitHub Auth] Unable to read Supabase session", error);
      if (!mounted) return;
      setSupabaseAccessToken(data.session?.access_token ?? null);
      setSignedIn(Boolean(data.session));
      setSessionReady(true);
    };

    void syncSession();
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (getActiveDemoPersona()) return;
      setSupabaseAccessToken(nextSession?.access_token ?? null);
      setSignedIn(Boolean(nextSession));
      setSessionReady(true);
      if (event === "SIGNED_OUT") {
        utils.auth.me.setData(undefined, null);
      } else if (nextSession) {
        void utils.auth.me.invalidate();
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [utils]);

  const loginAsPersona = useCallback(
    async (personaKey: string) => {
      setDemoPersonaToken(personaKey);
      setDemoPersona(personaKey);
      setSignedIn(true);
      setSessionReady(true);

      const profile = PERSONA_PROFILES[personaKey] ?? PERSONA_PROFILES.admin;
      utils.auth.me.setData(undefined, {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatarUrl: null,
        loginMethod: "demo",
        openId: `demo:${personaKey}`,
        lastSignedIn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      void utils.auth.me.refetch();
      void utils.workspace.mine.refetch();
      void utils.project.overview.refetch();
    },
    [utils]
  );

  const logout = useCallback(async () => {
    setDemoPersonaToken(null);
    setDemoPersona(null);
    setSignedIn(false);
    utils.auth.me.setData(undefined, null);
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore network errors on logout
    } finally {
      await supabase.auth.signOut();
      setSupabaseAccessToken(null);
      void utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "bugforge-runtime-user-info",
      JSON.stringify(meQuery.data ?? null)
    );
    return {
      user: meQuery.data ?? null,
      loading:
        !sessionReady ||
        (signedIn && meQuery.isLoading) ||
        logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
      demoPersona,
      loginAsPersona,
      refresh: () => meQuery.refetch(),
      logout,
    };
  }, [
    demoPersona,
    loginAsPersona,
    logout,
    logoutMutation.error,
    logoutMutation.isPending,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    meQuery.refetch,
    sessionReady,
    signedIn,
  ]);

  return state;
}

