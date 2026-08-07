"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdCard from "@/components/AdCard";
import Link from "next/link";
import { Trash2, Edit3, Plus } from "lucide-react"; 
import { extractSpecs } from "@/lib/utils";

interface Ad {
  id: string;
  title: string;
  price: number;
  location: string;
  category_slug: string;
  images: string[];
  status: string;
  attributes?: any;
  created_at: string;
}

export default function MyAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Maps for Make and Model name lookup
  const [makesMap, setMakesMap] = useState<Record<number, string>>({});
  const [modelsMap, setModelsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);
      
      // Fetch ads, makes, and models in parallel
      const [adsRes, makesRes, modelsRes] = await Promise.all([
        supabase
          .from("ads")
          .select("id, title, price, location, category_slug, images, status, attributes, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("makes").select("id, name"),
        supabase.from("models").select("id, name")
      ]);

      if (adsRes.data) setAds(adsRes.data as Ad[]);
      
      // Convert arrays to lookup maps for performance
      if (makesRes.data) setMakesMap(Object.fromEntries(makesRes.data.map(m => [m.id, m.name])));
      if (modelsRes.data) setModelsMap(Object.fromEntries(modelsRes.data.map(m => [m.id, m.name])));
      
      setLoading(false);
    }
    init();
  }, []);

  const handleDelete = async (adId: string) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;

    setDeletingId(adId);
    const { error } = await supabase.from("ads").delete().eq("id", adId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    }
    setDeletingId(null);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <Link href="/login" className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold">
          Login to manage ads
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">My Listings</h1>
        <Link href="/post-ad" className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
          <Plus size={18} /> Post Ad
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
          <p className="text-gray-500 mb-4">No listings found.</p>
          <Link href="/post-ad" className="text-orange-600 font-bold hover:underline">Post your first ad →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {ads.map((ad) => (
            <div key={ad.id} className="border rounded-2xl p-3 bg-white shadow-sm flex flex-col">
              <AdCard 
                {...ad} 
                status={ad.status} 
                showStatus={true} 
                price={String(ad.price)} 
                category={ad.category_slug} 
                imageUrl={ad.images?.[0]} 
                // extractSpecs handles pets and vehicles automatically
                specs={extractSpecs(ad.attributes)}
                // Look up names using the IDs stored in attributes
                makeName={ad.attributes?.make_id ? makesMap[ad.attributes.make_id] : undefined}
                modelName={ad.attributes?.model_id ? modelsMap[ad.attributes.model_id] : undefined}
              />
              
              <div className="flex gap-2 mt-auto pt-4">
                <Link href={`/my-ads/edit/${ad.id}`} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 py-2 rounded-xl text-sm font-bold transition">
                  <Edit3 size={16} /> Edit
                </Link>
                <button 
                  onClick={() => handleDelete(ad.id)} 
                  disabled={deletingId === ad.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-sm font-bold transition"
                >
                  <Trash2 size={16} /> {deletingId === ad.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}