"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { computeExpiresAt } from "@/constants/adPricing";
import { useTranslation } from "@/i18n/LocaleProvider";
import { adminAr } from "@/i18n/content/admin.ar";
import { adminEn } from "@/i18n/content/admin.en";
import { Shield, Trash2, CheckCircle, Users, FileText, UserPlus, UserMinus, Crown, AlertCircle, ChevronDown, ChevronUp, MapPin, Tag, Hourglass, Eye, Ban } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
  description?: string;
  images?: string[];
  created_at: string;
  expires_at?: string | null;
}

interface Profile {
  id: string;
  role: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"ads" | "users">("ads");
  const [adFilter, setAdFilter] = useState<"pending" | "active" | "banned">("pending");
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const router = useRouter();
  const { locale, t } = useTranslation();
  const c = locale === "ar" ? adminAr : adminEn;

  useEffect(() => {
    async function verifyAdminAndFetchAll() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile || (profile.role !== "admin" && profile.role !== "super")) {
        router.push("/"); 
        return;
      }

      setCurrentRole(profile.role);

      const { data: listings } = await supabase
        .from("ads")
        .select("id, title, price, location, status, description, images, created_at, expires_at")
        .order("created_at", { ascending: false });

      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("id, role")
        .order("role", { ascending: true });

      setAds(listings || []);
      setProfiles(userProfiles || []);
      setLoading(false);
    }

    verifyAdminAndFetchAll();
  }, [router]);

  const toggleExpandAd = (id: string) => {
    setExpandedAdId(expandedAdId === id ? null : id);
  };

  const handleUpdateStatus = async (id: string, newStatus: "active" | "banned") => {
    let message = "";
    if (newStatus === "banned") {
      message = c.confirmBan;
    } else {
      message = c.confirmApprove;
    }

    const confirmAction = window.confirm(message);
    if (!confirmAction) return;

    const current = ads.find((ad) => ad.id === id);
    const updates: { status: "active" | "banned"; expires_at?: string } = { status: newStatus };

    if (newStatus === "active" && (!current?.expires_at || current.status === "banned")) {
      updates.expires_at = computeExpiresAt();
    }
    
    const { error } = await supabase
      .from("ads")
      .update(updates)
      .eq("id", id);

    if (error) {
      alert(c.dbError.replace("{message}", error.message));
    } else {
      setAds((prev) =>
        prev.map((ad) => (ad.id === id ? { ...ad, ...updates } : ad))
      );
      setExpandedAdId(null);
    }
    router.refresh(); 
    // OR, if that doesn't work, force a full reload:
    window.location.reload();
  };

  const handleUpdateUserRole = async (userId: string, newRole: "admin" | "user" | "super") => {
    if (currentRole !== "super") {
      alert(c.accessDenied);
      return;
    }

    const confirmChange = window.confirm(
      c.confirmRoleChange.replace("{role}", newRole.toUpperCase()),
    );
    if (!confirmChange) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, role: newRole });

    if (!error) {
      setProfiles((prev) => {
        const exists = prev.some((prof) => prof.id === userId);
        if (exists) {
          return prev.map((prof) => (prof.id === userId ? { ...prof, role: newRole } : prof));
        }
        return [...prev, { id: userId, role: newRole }];
      });
      alert(c.roleUpdated);
    } else {
      alert(c.roleUpdateError.replace("{message}", error.message));
    }
  };

  const displayedAds = ads.filter((ad) => ad.status === adFilter);

  if (loading || !currentRole) {
    return <div className="text-center py-20 font-medium text-gray-500">{c.checkingCredentials}</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b pb-5 mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {currentRole === "super" ? (
            <Crown className="text-amber-500 animate-pulse" size={30} />
          ) : (
            <Shield className="text-[#FF6321]" size={28} />
          )}
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {locale === "ar"
                ? (currentRole === "super" ? c.titleSuper : c.titleAdmin)
                : `Yaddii ${currentRole === "super" ? c.titleSuper : c.titleAdmin}`}
            </h1>
            <p className="text-xs text-gray-400">{c.subtitle}</p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab("ads")}
            className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-lg transition-all ${
              activeTab === "ads" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <FileText size={14} />
            {c.tabAds}
          </button>
          
          {currentRole === "super" && (
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-lg transition-all ${
                activeTab === "users" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Users size={14} />
              {c.tabUsers}
            </button>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT DISTRIBUTOR */}
      {activeTab === "ads" ? (
        <div className="space-y-4">
          
          {/* SUB-NAVIGATION FILTER TABS LAYER */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => { setAdFilter("pending"); setExpandedAdId(null); }}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                adFilter === "pending"
                  ? "bg-amber-50 text-amber-700 border-amber-200 shadow-2xs font-extrabold"
                  : "bg-white text-gray-500 border-gray-100 hover:text-gray-800"
              }`}
            >
              <Hourglass size={14} />
              {c.filterPending} ({ads.filter(a => a.status === 'pending').length})
            </button>

            <button
              onClick={() => { setAdFilter("active"); setExpandedAdId(null); }}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                adFilter === "active"
                  ? "bg-green-50 text-green-700 border-green-200 shadow-2xs font-extrabold"
                  : "bg-white text-gray-500 border-gray-100 hover:text-gray-800"
              }`}
            >
              <Eye size={14} />
              {c.filterActive} ({ads.filter(a => a.status === 'active').length})
            </button>

            <button
              onClick={() => { setAdFilter("banned"); setExpandedAdId(null); }}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                adFilter === "banned"
                  ? "bg-red-50 text-red-700 border-red-200 shadow-2xs font-extrabold"
                  : "bg-white text-gray-500 border-gray-100 hover:text-gray-800"
              }`}
            >
              <Ban size={14} />
              {c.filterBanned} ({ads.filter(a => a.status === 'banned').length})
            </button>
          </div>

          {/* DYNAMIC DATA TABLE VIEW CONTAINER */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {displayedAds.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm font-medium">
                {c.noAds}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-black uppercase tracking-wider text-gray-400">
                    <th className="p-4 w-8"></th>
                    <th className="p-4">{c.colTitle}</th>
                    <th className="p-4">{c.colPrice}</th>
                    <th className="p-4">{c.colLocation}</th>
                    <th className="p-4 text-right">{c.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {displayedAds.map((ad) => {
                    const isExpanded = expandedAdId === ad.id;
                    return (
                      <React.Fragment key={ad.id}>
                        
                        {/* ACCORDION TRIGGER MASTER ROW */}
                        <tr 
                          onClick={() => toggleExpandAd(ad.id)}
                          className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                        >
                          <td className="p-4 text-gray-400">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </td>
                          <td className="p-4 font-bold text-gray-900 max-w-xs truncate">{ad.title}</td>
                          <td className="p-4 text-[#FF6321] font-extrabold">{ad.price} {t("common.egp")}</td>
                          <td className="p-4 text-gray-500">{ad.location}</td>
                          
                          {/* SMART BUTTON CONTROLS */}
                          <td className="p-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                            {ad.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(ad.id, "active")}
                                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-2xs"
                                >
                                  {c.approve}
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(ad.id, "banned")}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                                >
                                  {c.reject}
                                </button>
                              </>
                            )}
                            {ad.status === "active" && (
                              <button
                                onClick={() => handleUpdateStatus(ad.id, "banned")}
                                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                              >
                                {c.banAd}
                              </button>
                            )}
                            {ad.status === "banned" && (
                              <button
                                onClick={() => handleUpdateStatus(ad.id, "active")}
                                className="bg-green-50 hover:bg-green-100 text-green-600 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                              >
                                {c.restore}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* EXPANDED REVIEW PANEL DRAWER */}
                        {isExpanded && (
                          <tr className="bg-gray-50/60 shadow-inner">
                            <td colSpan={5} className="p-6 border-l-4 border-orange-500">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">{c.listingDescription}</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                                      {ad.description || c.noDescription}
                                    </p>
                                  </div>
                                  
                                  <div className="flex gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
                                      <MapPin size={12} className="text-gray-400" /> {ad.location}
                                    </span>
                                    <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
                                      <Tag size={12} className="text-orange-500" /> {ad.price} {t("common.egp")}
                                    </span>
                                    {ad.expires_at && ad.status === "active" && (
                                      <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
                                        <Hourglass size={12} className="text-gray-400" />
                                        {c.liveUntil.replace("{date}", new Date(ad.expires_at!).toLocaleDateString())}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">{c.imageGallery}</h4>
                                  {ad.images && ad.images.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      {ad.images.map((imgUrl, idx) => (
                                        <a 
                                          key={idx} 
                                          href={imgUrl} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          className="group block relative overflow-hidden bg-gray-100 rounded-xl border border-gray-200 aspect-square"
                                        >
                                          <img 
                                            src={imgUrl} 
                                            alt={`Ad Content View ${idx + 1}`}
                                            className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400 border border-dashed rounded-xl p-6 text-center bg-white">
                                      {c.noImages}
                                    </div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* USER ROLES VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-black uppercase tracking-wider text-gray-400">
                <th className="p-4">{c.colUserId}</th>
                <th className="p-4">{c.colRole}</th>
                <th className="p-4 text-right">{c.colAccess}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {profiles.map((profileItem) => (
                <tr key={profileItem.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-gray-600">{profileItem.id}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      profileItem.role === 'super' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      profileItem.role === 'admin' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {profileItem.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {profileItem.role === "super" ? (
                      <span className="text-xs text-gray-400 font-medium italic pr-4">{c.creatorTier}</span>
                    ) : (
                      <>
                        {profileItem.role !== "admin" ? (
                          <button
                            onClick={() => handleUpdateUserRole(profileItem.id, "admin")}
                            disabled={currentRole !== "super"}
                            className="inline-flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-[#FF6321] disabled:opacity-50 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                          >
                            <UserPlus size={13} />
                            {c.makeAdmin}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateUserRole(profileItem.id, "user")}
                            disabled={currentRole !== "super"}
                            className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-500 disabled:opacity-50 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                          >
                            <UserMinus size={13} />
                            {c.demoteUser}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}