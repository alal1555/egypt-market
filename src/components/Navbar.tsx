"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Compass, Heart, Shield, Crown, LayoutGrid, PlusCircle } from "lucide-react";

function NavbarContent() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [textInput, setTextInput] = useState(""); 
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync the search input with the URL 'q' parameter
  useEffect(() => {
    setTextInput(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const fetchUserRoleFromTable = async (userId: string) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!error && profile) {
        setUserRole(profile.role);
      }
    };

    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await fetchUserRoleFromTable(user.id);
    };
    getUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserRoleFromTable(currentUser.id);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    router.push("/");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) {
      router.push("/search");
    } else {
      router.push(`/search?q=${encodeURIComponent(textInput.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 border-b border-gray-100 bg-white z-50 px-3 md:px-4 h-14 md:h-16 w-full m-0 flex items-center">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 md:gap-4">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity shrink-0">
          <Image 
            src="/logo.png" 
            alt="Yaddii Logo"
            width={85}   
            height={34}   
            priority 
            className="object-contain max-h-10 md:max-h-14 w-auto" 
          />
        </Link>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs relative items-center hidden md:flex">
          <input
            type="text"
            placeholder="Search..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full bg-gray-50 text-gray-700 pl-4 pr-10 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6321] text-sm transition"
          />
          <button type="submit" className="absolute right-3 text-gray-400 hover:text-[#FF6321]">
            <Search size={16} />
          </button>
        </form>

        {/* DESKTOP ACTIONS TRAY */}
        <div className="hidden md:flex items-center gap-4 md:gap-6 shrink-0">
          <Link href="/search" className="p-1.5 flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-[#FF6321] transition-colors">
            <Compass size={18} />
            <span>Explore</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              {(userRole === "admin" || userRole === "super") && (
                <Link href="/admin/dashboard" className={`font-bold px-3 py-1.5 rounded-xl transition text-xs flex items-center gap-1.5 ${
                  userRole === "super" ? "text-amber-700 bg-amber-50 border border-amber-200" : "text-[#FF6321] bg-orange-50"
                }`}>
                  {userRole === "super" ? <Crown size={14} /> : <Shield size={14} />}
                  <span>{userRole === "super" ? "Supreme Admin" : "Admin Panel"}</span>
                </Link>
              )}

              <Link href="/favorites" className="p-1.5 text-gray-600 hover:text-red-500 font-bold text-sm flex items-center gap-1">
                <Heart size={18} />
                <span>Favorites</span>
              </Link>

              <Link href="/my-ads" className="p-1.5 text-gray-600 hover:text-[#FF6321] font-bold text-sm flex items-center gap-1">
                <LayoutGrid size={18} />
                <span>My Ads</span>
              </Link>
          
              <Link href="/post-ad" className="text-sm font-bold text-white bg-[#FF6321] hover:bg-[#e85a1e] transition-colors whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-sm">
                <PlusCircle size={16} />
                <span>Post Ad</span>
              </Link>
              
              <button 
                onClick={handleLogout} 
                className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors border border-gray-100 px-2.5 py-1.5 rounded-xl"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-[#FF6321] px-2 py-1">
                Login
              </Link>
              <Link href="/signup" className="rounded-xl bg-[#FF6321] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#e85a1e] transition-all">
                Start Selling
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE AUTH BUTTONS */}
        <div className="md:hidden flex items-center shrink-0">
          {user ? (
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl bg-white hover:text-red-500 transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link 
              href="/login"
              className="text-xs font-bold text-white bg-[#FF6321] px-4 py-1.5 rounded-xl shadow-sm hover:bg-[#e85a1e]"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<nav className="h-16 bg-white w-full border-b" />}>
      <NavbarContent />
    </Suspense>
  );
}