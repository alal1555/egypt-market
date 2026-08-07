"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User, Mail, Phone, Shield, Crown, Calendar } from "lucide-react";

export default function ProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState("user");
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    let active = true;
    let settled = false;

    const finish = (authUser: any | null) => {
      if (!active || settled) return;
      settled = true;
      window.clearTimeout(timeout);

      if (authUser) {
        setUser(authUser);
        setFormData({
          fullName: authUser.user_metadata?.full_name || "",
          phone: authUser.user_metadata?.phone_number || "",
          email: authUser.email || "",
        });
        if (authUser.created_at) {
          setMemberSince(new Date(authUser.created_at).toLocaleDateString());
        }
        supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (active && profile?.role) setRole(profile.role);
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      } else {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      finish(session?.user ?? null);
    });

    const timeout = window.setTimeout(() => {
      if (active && !settled) {
        setLoadError("Session timed out. Please refresh or log in again.");
        setLoading(false);
      }
    }, 5000);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: formData.fullName,
        phone_number: formData.phone,
      },
    });
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profile updated successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6321]" />
        <p className="text-gray-500 text-sm">Loading profile...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{loadError}</p>
        <Link href="/login" className="bg-[#FF6321] text-white px-6 py-3 rounded-xl font-bold">
          Go to Login
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="text-gray-500 mb-6">Log in to view and edit your profile.</p>
        <Link href="/login" prefetch={false} className="bg-[#FF6321] text-white px-6 py-3 rounded-xl font-bold">
          Login
        </Link>
      </div>
    );
  }

  const roleLabel =
    role === "super" ? "Supreme Admin" : role === "admin" ? "Admin" : "Member";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 min-h-[50vh]">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#FF6321] to-orange-400 px-8 py-10 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black uppercase">
              {formData.fullName?.[0] || formData.email?.[0] || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-black">{formData.fullName || "Your Profile"}</h1>
              <p className="text-orange-100 text-sm mt-1">{formData.email}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-b bg-gray-50 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-2 font-bold text-gray-700 bg-white px-3 py-1.5 rounded-full border">
            {role === "super" ? (
              <Crown size={16} className="text-amber-600" />
            ) : role === "admin" ? (
              <Shield size={16} className="text-[#FF6321]" />
            ) : (
              <User size={16} />
            )}
            {roleLabel}
          </span>
          {memberSince && (
            <span className="inline-flex items-center gap-2 text-gray-500">
              <Calendar size={16} />
              Member since {memberSince}
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <User size={16} /> Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Your full name"
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF6321]"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Phone size={16} /> Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#FF6321]"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#FF6321] text-white font-bold py-3 rounded-xl hover:bg-[#e85a1e] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <div className="px-8 pb-8 flex flex-wrap gap-3">
          <Link href="/my-ads" prefetch={false} className="text-sm font-bold text-[#FF6321] hover:underline">
            My Ads →
          </Link>
          <Link href="/favorites" prefetch={false} className="text-sm font-bold text-gray-600 hover:text-[#FF6321]">
            Favorites →
          </Link>
        </div>
      </div>
    </div>
  );
}
