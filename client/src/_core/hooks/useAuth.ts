import { trpc } from "@/lib/trpc";
import {
  getActiveDemoPersona,
  setDemoPersonaToken,
  setSupabaseAccessToken,
  supabase,
} from "@/lib/supabase";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAuth() {
  const utils = trpc.useUtils();
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [demoPersona, setDemoPersona] = useState<string | null>(() =>
    getActiveDemoPersona()
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
      await utils.auth.me.invalidate();
      await utils.workspace.mine.invalidate();
      await utils.project.overview.invalidate();
    },
    [utils]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // The local Supabase session still needs to be cleared below.
      } else {
        throw error;
      }
    } finally {
      setDemoPersonaToken(null);
      setDemoPersona(null);
      await supabase.auth.signOut();
      setSupabaseAccessToken(null);
      setSignedIn(false);
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
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

