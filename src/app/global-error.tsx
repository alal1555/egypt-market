"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Yaddii] global error", error);
  }, [error]);

  const isServerError = Boolean(error?.digest);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans text-gray-900">
        <div className="max-w-md w-full rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-lg font-bold text-gray-900 mb-2">Yaddii hit a snag</p>
          <p className="text-sm text-gray-600 mb-6">
            {isServerError
              ? "Something went wrong on our side. Try reloading the page."
              : "The page did not load correctly. Reload or go back to the home page."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-[#FF6321] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e85a1e]"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
