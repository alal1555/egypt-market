"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    window.location.replace(`/reset-password${window.location.hash}${window.location.search}`);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-gray-500">Redirecting...</div>
    </main>
  );
}
