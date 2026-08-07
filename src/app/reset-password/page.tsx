"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function parseRecoveryHash() {
  if (typeof window === "undefined" || !window.location.hash) return null;

  const params = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = params.get("access_token");
  const type = params.get("type");

  if (type !== "recovery" || !accessToken) return null;

  return { accessToken };
}

async function updatePasswordWithToken(accessToken: string, password: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.msg || body.message || body.error_description || "Failed to update password.");
  }
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const recovery = parseRecoveryHash();
    if (recovery) {
      accessTokenRef.current = recovery.accessToken;
      window.history.replaceState(null, "", window.location.pathname);
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        accessTokenRef.current = session.access_token;
        setReady(true);
      } else {
        setError("Recovery link is invalid or expired. Please request a new reset link.");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const token = accessTokenRef.current;
    if (!token) {
      alert("Recovery session expired. Please request a new reset link.");
      return;
    }

    setLoading(true);

    try {
      await updatePasswordWithToken(token, password);
      await supabase.auth.signOut();
      alert("Password updated successfully! Please log in with your new password.");
      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (error && !ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center space-y-4">
          <h1 className="text-2xl font-black">Link expired</h1>
          <p className="text-sm text-gray-600">{error}</p>
          <Link href="/forgot-password" className="inline-block text-sm font-bold text-[#FF6321] hover:underline">
            Request a new reset link
          </Link>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-gray-500">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-black text-center mb-2">Set New Password</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6321]"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6321]"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6321] text-white font-bold py-3 rounded-lg hover:bg-[#e85a1e] transition-colors disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
