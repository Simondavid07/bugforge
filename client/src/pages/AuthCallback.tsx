import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("Completing GitHub sign-in…");

  useEffect(() => {
    let mounted = true;

    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorDescription =
        params.get("error_description") ?? params.get("error");

      if (errorDescription) {
        if (mounted)
          setMessage(
            `GitHub sign-in was cancelled or failed: ${errorDescription}`
          );
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[GitHub Auth] Callback exchange failed", error);
          if (mounted)
            setMessage(
              "GitHub sign-in could not be completed. Please try again."
            );
          return;
        }
      } else {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          if (mounted)
            setMessage(
              "GitHub sign-in did not return a valid session. Please try again."
            );
          return;
        }
      }

      if (mounted) setLocation("/");
    };

    void completeSignIn();
    return () => {
      mounted = false;
    };
  }, [setLocation]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#FAFAF6] px-5 text-[#19352D]">
      <section className="soft-card w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18342C] text-white">
          GH
        </div>
        <p className="eyebrow mt-7 text-[#718079]">BugForge authentication</p>
        <h1 className="display-heading mt-3 text-3xl">{message}</h1>
        <p className="mt-4 text-sm leading-6 text-[#718079]">
          You can close this page after the workspace opens.
        </p>
      </section>
    </main>
  );
}
