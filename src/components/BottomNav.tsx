"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, LayoutGrid, PlusCircle, Shield, Crown } from "lucide-react";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function BottomNav() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserRole = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (profile) setUserRole(profile.role);
    };

    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await fetchUserRole(user.id);
    };
    getUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserRole(currentUser.id);
      } else {
        setUserRole(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Helper function to highlight the active tab
  const isActive = (path: string) => pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 h-16 px-2 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      
      {/* Explore */}
      <Link 
        href="/search" 
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isActive("/search") ? "text-[#FF6321]" : "text-gray-500"
        }`}
      >
        <Compass size={20} strokeWidth={isActive("/search") ? 2.5 : 2} />
        <span className="text-[10px] font-bold mt-0.5">{t("nav.explore")}</span>
      </Link>

      {/* Favorites */}
      <Link 
        href="/favorites" 
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isActive("/favorites") ? "text-red-500" : "text-gray-500"
        }`}
      >
        <Heart size={20} strokeWidth={isActive("/favorites") ? 2.5 : 2} />
        <span className="text-[10px] font-bold mt-0.5">{t("nav.favorites")}</span>
      </Link>

      {/* Post Ad (Centered Action Button) */}
      <Link 
        href="/post-ad" 
        className="relative flex flex-col items-center justify-center flex-1 py-1 text-[#FF6321]"
      >
        <div className="relative -top-3 bg-[#FF6321] text-white p-2 rounded-full shadow-sm border-4 border-white">
          <PlusCircle size={22} strokeWidth={2.5} />
        </div>
        <span className="text-[10px] font-black mt-1 text-[#FF6321]">{t("nav.postAd")}</span>
      </Link>

      {/* My Ads */}
      <Link 
        href="/my-ads" 
        className={`relative z-10 flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isActive("/my-ads") ? "text-[#FF6321]" : "text-gray-500"
        }`}
      >
        <LayoutGrid size={20} strokeWidth={isActive("/my-ads") ? 2.5 : 2} />
        <span className="text-[10px] font-bold mt-0.5">{t("nav.myAds")}</span>
      </Link>

      {user && (userRole === "admin" || userRole === "super") && (
        <Link 
          href="/admin/dashboard" 
          className={`relative z-10 flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isActive("/admin/dashboard") ? "text-amber-600" : "text-gray-500"
          }`}
        >
          {userRole === "super" ? <Crown size={20} /> : <Shield size={20} />}
          <span className="text-[10px] font-bold mt-0.5">{t("nav.admin")}</span>
        </Link>
      )}

      <Link 
        href={user ? "/profile" : "/login"}
        prefetch={false}
        className={`relative z-10 flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isActive("/profile") || isActive("/login") ? "text-[#FF6321]" : "text-gray-500"
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase">
          {user ? user.email?.[0] : "?"}
        </div>
        <span className="text-[10px] font-bold mt-0.5">{user ? t("nav.profile") : t("nav.login")}</span>
      </Link>

    </div>
  );
}