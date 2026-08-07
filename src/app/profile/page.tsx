"use client";

import dynamic from "next/dynamic";

const ProfileClient = dynamic(() => import("./ProfileClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6321]" />
      <p className="text-gray-500 text-sm">Loading profile...</p>
    </div>
  ),
});

export default function ProfilePage() {
  return <ProfileClient />;
}
