"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-black text-center mb-2">Reset Password</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              If an account exists for <strong>{email}</strong>, check your inbox for a reset link.
            </p>
            <Link href="/login" className="inline-block text-sm font-bold text-[#FF6321] hover:underline">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6321]"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6321] text-white font-bold py-3 rounded-lg hover:bg-[#e85a1e] transition-colors disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <Link href="/login" className="block text-center text-sm text-gray-500 hover:text-[#FF6321]">
              Back to Login
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
