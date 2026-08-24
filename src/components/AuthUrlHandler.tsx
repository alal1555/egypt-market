"use client";

import { useEffect } from "react";
import { redirectAuthParamsToCallback } from "@/lib/auth-client";

/** Forwards Supabase auth tokens that land on `/` (or any page) to `/auth/callback`. */
export default function AuthUrlHandler() {
  useEffect(() => {
    redirectAuthParamsToCallback();
  }, []);

  return null;
}
