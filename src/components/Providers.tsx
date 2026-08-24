"use client";

import { LocaleProvider } from "@/i18n/LocaleProvider";
import AuthUrlHandler from "@/components/AuthUrlHandler";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthUrlHandler />
      {children}
    </LocaleProvider>
  );
}
