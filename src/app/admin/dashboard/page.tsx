"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { computeExpiresAt } from "@/constants/adPricing";
import { notifyPendingAdsChanged } from "@/hooks/usePendingAdsCount";
import { useTranslation } from "@/i18n/LocaleProvider";
import { adminAr } from "@/i18n/content/admin.ar";
import { adminEn, type AdminContent } from "@/i18n/content/admin.en";
import { Shield, Users, FileText, UserPlus, UserMinus, Crown, ChevronDown, ChevronUp, MapPin, Tag, Hourglass, Eye, Ban } from "lucide-react";

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
  listing_type?: string;
  auction_duration_hours?: number | null;
  auction_status?: string | null;
  auction_current_bid?: number | null;
  auction_bid_count?: number;
  auction_ends_at?: string | null;
}

interface Profile {
  id: string;
  role: string;
  email?: string | null;
  full_name?: string | null;
  created_at?: string;
}

function AdActionButtons({
  ad,
  c,
  onUpdateStatus,
  className = "",
}: {
  ad: Ad;
  c: AdminContent;
  onUpdateStatus: (id: string, status: "active" | "banned") => void;
  className?: string;
}) {
  const btn =
    "font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-2xs disabled:opacity-50";
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {ad.status === "pending" && (
        <>
          <button
            type="button"
            onClick={() => onUpdateStatus(ad.id, "active")}
            className={`${btn} bg-green-600 hover:bg-green-700 text-white`}
          >
            {c.approve}
          </button>
          <button
            type="button"
            onClick={() => onUpdateStatus(ad.id, "banned")}
            className={`${btn} bg-red-50 hover:bg-red-100 text-red-600 shadow-none`}
          >
            {c.reject}
          </button>
        </>
      )}
      {ad.status === "active" && (
        <button
          type="button"
          onClick={() => onUpdateStatus(ad.id, "banned")}
          className={`${btn} bg-red-50 hover:bg-red-100 text-red-600 shadow-none`}
        >
          {c.banAd}
        </button>
      )}
      {ad.status === "banned" && (
        <button
          type="button"
          onClick={() => onUpdateStatus(ad.id, "active")}
          className={`${btn} bg-green-50 hover:bg-green-100 text-green-600 shadow-none`}
        >
          {c.restore}
        </button>
      )}
    </div>
  );
}

function AdExpandedPanel({
  ad,
  c,
  egpLabel,
}: {
  ad: Ad;
  c: AdminContent;
  egpLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
            {c.listingDescription}
          </h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
            {ad.description || c.noDescription}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
            <MapPin size={12} className="text-gray-400 shrink-0" /> {ad.location}
          </span>
          <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
            <Tag size={12} className="text-orange-500 shrink-0" /> {ad.price} {egpLabel}
          </span>
          {ad.expires_at && ad.status === "active" && (
            <span className="flex items-center gap-1 bg-white border px-2.5 py-1 rounded-md">
              <Hourglass size={12} className="text-gray-400 shrink-0" />
              {c.liveUntil.replace("{date}", new Date(ad.expires_at).toLocaleDateString())}
            </span>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
          {c.imageGallery}
        </h4>
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
                  alt={`Ad ${idx + 1}`}
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
  );
}

function UserRoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
        role === "super"
          ? "bg-amber-100 text-amber-800 border border-amber-200"
          : role === "admin"
            ? "bg-orange-100 text-orange-800 border border-orange-200"
            : "bg-gray-100 text-gray-600"
      }`}
    >
      {role}
    </span>
  );
}

function UserAccessControls({
  profileItem,
  currentRole,
  c,
  onUpdateUserRole,
}: {
  profileItem: Profile;
  currentRole: string;
  c: AdminContent;
  onUpdateUserRole: (userId: string, newRole: "admin" | "user" | "super") => void;
}) {
  if (profileItem.role === "super") {
    return <span className="text-xs text-gray-400 font-medium italic">{c.creatorTier}</span>;
  }

  if (profileItem.role !== "admin") {
    return (
      <button
        type="button"
        onClick={() => onUpdateUserRole(profileItem.id, "admin")}
        disabled={currentRole !== "super"}
        className="inline-flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-[#FF6321] disabled:opacity-50 font-bold text-xs px-3 py-1.5 rounded-lg transition"
      >
        <UserPlus size={13} />
        {c.makeAdmin}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onUpdateUserRole(profileItem.id, "user")}
      disabled={currentRole !== "super"}
      className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-500 disabled:opacity-50 font-bold text-xs px-3 py-1.5 rounded-lg transition"
    >
      <UserMinus size={13} />
      {c.demoteUser}
    </button>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"ads" | "users">("ads");
  const [adFilter, setAdFilter] = useState<"pending" | "active" | "banned">("pending");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "user" | "admin" | "super">("all");
  
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
        .select("id, title, price, location, status, description, images, created_at, expires_at, listing_type, auction_duration_hours, auction_status, auction_current_bid, auction_bid_count, auction_ends_at")
        .order("created_at", { ascending: false });

      let userProfiles: Profile[] = [];
      if (profile.role === "super") {
        const { data: adminUsers, error: usersError } = await supabase.rpc("admin_list_users");
        if (!usersError && adminUsers) {
          userProfiles = adminUsers as Profile[];
        } else {
          const { data: fallbackProfiles } = await supabase
            .from("profiles")
            .select("id, role, email, full_name")
            .order("role", { ascending: true });
          userProfiles = (fallbackProfiles || []) as Profile[];
        }
      }

      setAds(listings || []);
      setProfiles(userProfiles);
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
    const updates: {
      status: "active" | "banned";
      expires_at?: string;
      auction_status?: string;
      auction_ends_at?: string;
    } = { status: newStatus };

    if (newStatus === "active" && (!current?.expires_at || current.status === "banned")) {
      if (current?.listing_type === "auction") {
        const hours = current.auction_duration_hours ?? 24;
        const endsAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        updates.auction_status = "live";
        updates.auction_ends_at = endsAt;
        updates.expires_at = endsAt;
      } else {
        updates.expires_at = computeExpiresAt();
      }
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
      notifyPendingAdsChanged();
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
  const displayedProfiles =
    userRoleFilter === "all"
      ? profiles
      : profiles.filter((p) => p.role === userRoleFilter);

  const userCount = (role: "user" | "admin" | "super") =>
    profiles.filter((p) => p.role === role).length;

  if (loading || !currentRole) {
    return <div className="text-center py-20 font-medium text-gray-500">{c.checkingCredentials}</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10 pb-4">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-5 mb-6 md:mb-8 gap-4">
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

        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("ads")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 sm:px-4 py-2 rounded-lg transition-all ${
              activeTab === "ads" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <FileText size={14} />
            {c.tabAds}
          </button>
          
          {currentRole === "super" && (
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 sm:px-4 py-2 rounded-lg transition-all ${
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
          <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto -mx-1 px-1 scrollbar-none">
            <button
              onClick={() => { setAdFilter("pending"); setExpandedAdId(null); }}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 sm:px-4 py-2 rounded-xl border transition-all ${
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
              className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 sm:px-4 py-2 rounded-xl border transition-all ${
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
              className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 sm:px-4 py-2 rounded-xl border transition-all ${
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
              <>
                {/* Mobile: card list */}
                <div className="md:hidden divide-y divide-gray-100">
                  {displayedAds.map((ad) => {
                    const isExpanded = expandedAdId === ad.id;
                    return (
                      <div key={ad.id} className="p-4">
                        <button
                          type="button"
                          onClick={() => toggleExpandAd(ad.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 break-words">{ad.title}</p>
                              <p className="text-[#FF6321] font-extrabold mt-1">
                                {ad.price} {t("common.egp")}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                                <MapPin size={12} className="shrink-0" />
                                {ad.location}
                              </p>
                            </div>
                            <span className="text-gray-400 shrink-0 pt-1">
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </span>
                          </div>
                        </button>

                        <AdActionButtons
                          ad={ad}
                          c={c}
                          onUpdateStatus={handleUpdateStatus}
                          className="mt-3"
                        />

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-100 border-l-4 border-orange-500 pl-3">
                            <AdExpandedPanel ad={ad} c={c} egpLabel={t("common.egp")} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <table className="hidden md:table w-full text-left border-collapse">
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
                          <tr
                            onClick={() => toggleExpandAd(ad.id)}
                            className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                          >
                            <td className="p-4 text-gray-400">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </td>
                            <td className="p-4 font-bold text-gray-900 max-w-xs truncate">{ad.title}</td>
                            <td className="p-4 text-[#FF6321] font-extrabold">
                              {ad.price} {t("common.egp")}
                            </td>
                            <td className="p-4 text-gray-500">{ad.location}</td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <AdActionButtons
                                ad={ad}
                                c={c}
                                onUpdateStatus={handleUpdateStatus}
                                className="justify-end"
                              />
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-gray-50/60 shadow-inner">
                              <td colSpan={5} className="p-6 border-l-4 border-orange-500">
                                <AdExpandedPanel ad={ad} c={c} egpLabel={t("common.egp")} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      ) : (
        /* USER ROLES VIEW */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label htmlFor="user-role-filter" className="text-xs font-black uppercase tracking-wider text-gray-500">
              {c.filterUserRoleLabel}
            </label>
            <select
              id="user-role-filter"
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value as typeof userRoleFilter)}
              className="w-full sm:w-auto min-w-[220px] text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#FF6321]/40"
            >
              <option value="all">
                {c.filterAllUsers} ({profiles.length})
              </option>
              <option value="user">
                {c.filterUsersOnly} ({userCount("user")})
              </option>
              <option value="admin">
                {c.filterAdminsOnly} ({userCount("admin")})
              </option>
              <option value="super">
                {c.filterSuperOnly} ({userCount("super")})
              </option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {displayedProfiles.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm font-medium">
              {c.noUsers}
            </div>
          ) : (
            <>
          {/* Mobile: cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {displayedProfiles.map((profileItem) => (
              <div key={profileItem.id} className="p-4 space-y-3">
                <div>
                  <p className="font-bold text-gray-900 break-all">
                    {profileItem.email || c.noEmail}
                  </p>
                  {profileItem.full_name ? (
                    <p className="text-sm text-gray-600 mt-0.5">{profileItem.full_name}</p>
                  ) : null}
                  <p className="font-mono text-[10px] leading-relaxed text-gray-400 break-all mt-1">
                    {profileItem.id}
                  </p>
                </div>
                <UserRoleBadge role={profileItem.role} />
                <UserAccessControls
                  profileItem={profileItem}
                  currentRole={currentRole}
                  c={c}
                  onUpdateUserRole={handleUpdateUserRole}
                />
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <table className="hidden md:table w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-black uppercase tracking-wider text-gray-400">
                <th className="p-4">{c.colEmail}</th>
                <th className="p-4">{c.colName}</th>
                <th className="p-4">{c.colRole}</th>
                <th className="p-4">{c.colUserId}</th>
                <th className="p-4 text-right">{c.colAccess}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {displayedProfiles.map((profileItem) => (
                <tr key={profileItem.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-900 break-all">
                    {profileItem.email || c.noEmail}
                  </td>
                  <td className="p-4 text-gray-600">{profileItem.full_name || "—"}</td>
                  <td className="p-4">
                    <UserRoleBadge role={profileItem.role} />
                  </td>
                  <td className="p-4 font-mono text-[10px] font-bold text-gray-500 break-all max-w-[140px]">
                    {profileItem.id}
                  </td>
                  <td className="p-4 text-right">
                    <UserAccessControls
                      profileItem={profileItem}
                      currentRole={currentRole}
                      c={c}
                      onUpdateUserRole={handleUpdateUserRole}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </>
          )}
        </div>
        </div>
      )}
    </div>
  );
}