"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getSessionUser, signOutSafely } from "@/lib/auth-client";

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchRole = (userId: string) => {
      void supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!cancelled && !error && data?.role) {
            setUserRole(data.role);
          }
        });
    };

    void getSessionUser().then((sessionUser) => {
      if (cancelled) return;
      setUser(sessionUser);
      if (sessionUser) fetchRole(sessionUser.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Never async/await here — it can deadlock signOut/getSession.
        setTimeout(() => {
          if (!cancelled) fetchRole(currentUser.id);
        }, 0);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    setUser(null);
    setUserRole(null);
    try {
      await signOutSafely();
    } finally {
      setLoggingOut(false);
    }
  }, []);

  return { user, userRole, loggingOut, logout };
}
