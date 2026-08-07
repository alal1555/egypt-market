"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, EyeOff, Clock, CheckCircle, MapPin } from "lucide-react"; 
import { supabase } from "@/lib/supabase";

interface AdProps {
  id: string;
  title: string;
  price: string;
  location: string;
  category: string;
  imageUrl?: string;
  specs?: Record<string, any>;
  makeName?: string | null;
  modelName?: string | null;
  postedDate?: string;
  currentUserId?: string | null; 
  status?: string; 
  showStatus?: boolean;
}

export default function AdCard({ 
  id, title, price, location, imageUrl, specs = {}, postedDate,
  makeName, modelName, currentUserId: propUserId, status = "active", showStatus = false 
}: AdProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propUserId) { setUserId(propUserId); return; }
    async function fetchLocalUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUserId(session.user.id);
    }
    fetchLocalUser();
  }, [propUserId]);

  useEffect(() => {
    if (!userId) { setIsFavorited(false); return; }
    async function checkFavoriteStatus() {
      const { data } = await supabase.from("favorites").select("id").eq("user_id", userId).eq("ad_id", id).maybeSingle();
      setIsFavorited(!!data);
    }
    checkFavoriteStatus();
  }, [id, userId]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    let activeUserId = userId;
    if (!activeUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      activeUserId = session?.user?.id || null;
    }
    if (!activeUserId) { alert("Please login to save favorite ads!"); return; }
    if (loading) return;
    setLoading(true);

    if (isFavorited) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", activeUserId).eq("ad_id", id);
      if (!error) setIsFavorited(false);
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id: activeUserId, ad_id: id });
      if (!error) setIsFavorited(true);
    }
    setLoading(false);
  };

  const statusConfig: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
    pending: { label: "Pending", color: "bg-amber-500", icon: <Clock size={11} /> },
    active: { label: "Live", color: "bg-emerald-500", icon: <CheckCircle size={11} /> },
    banned: { label: "Banned", color: "bg-red-600", icon: <EyeOff size={11} /> }
  };

  const displayImage = imageUrl || "https://via.placeholder.com/600x400?text=No+Image";

  return (
    <Link href={`/product/${id}`} className="flex h-full">
      {/* Added 'flex flex-col h-full' to ensure the card stretches to grid cell height */}
      <div className="group flex flex-col w-full overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 relative">
        
        <button onClick={handleFavoriteClick} disabled={loading} className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition text-gray-500 focus:outline-none">
          <Heart size={18} className={`transition-colors duration-200 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"}`} />
        </button>

        {showStatus && statusConfig[status] && (
           <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1 ${statusConfig[status].color}`}>
              {statusConfig[status].icon} {statusConfig[status].label}
           </div>
        )}

        <div className="relative h-48 w-full overflow-hidden bg-gray-50 flex-shrink-0">
          <img src={displayImage} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </div>
        
        {/* Added 'flex flex-col flex-grow' to push footer to the bottom */}
        <div className="p-4 flex flex-col flex-grow">
          {(makeName || modelName) && (
            <div className="text-[10px] font-black text-[#FF6321] uppercase tracking-wider mb-1">
              {makeName} {modelName}
            </div>
          )}

          <h3 className="text-lg font-bold mb-1 truncate text-gray-900">{title}</h3>
          
          {/* This section grows to fill space, pushing price to the bottom */}
          <div className="flex-grow">
            <p className="font-black text-xl mb-2 text-[#FF6321]">{price} EGP</p>
            
            {specs && Object.keys(specs).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(specs).map(([key, value]) => {
                  const technicalKeys = ['make_id', 'model_id', 'cat_id', 'sub_cat_id', 'user_id', 'id', 'created_at', 'status'];
                  if (technicalKeys.includes(key) || !value) return null;
                  
                  return (
                    <span key={key} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-md capitalize">
                      {key.replace(/_/g, ' ')}: {String(value)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Footer container with mt-auto */}
          <div className="flex justify-between items-center text-gray-500 text-xs mt-4">
            <span className="flex items-center gap-1"><MapPin size={12} /> {location}</span>
            {postedDate && <span>{postedDate}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}