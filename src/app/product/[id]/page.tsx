"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import AdCard from "@/components/AdCard";
import { extractSpecs } from "@/lib/utils";

export default function ProductPage() {
  const params = useParams();
  const [ad, setAd] = useState<any>(null);
  const [relatedAds, setRelatedAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // NEW: Maps for name lookup
  const [makesMap, setMakesMap] = useState<Record<number, string>>({});
  const [modelsMap, setModelsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchFullData = async () => {
      if (!params.id) return;
      setLoading(true);
      
      // Fetch Ad + References in parallel
      const [adRes, makesRes, modelsRes] = await Promise.all([
        supabase.from("ads").select("*").eq("id", params.id).single(),
        supabase.from("makes").select("id, name"),
        supabase.from("models").select("id, name")
      ]);

      if (makesRes.data) setMakesMap(Object.fromEntries(makesRes.data.map(m => [m.id, m.name])));
      if (modelsRes.data) setModelsMap(Object.fromEntries(modelsRes.data.map(m => [m.id, m.name])));

      if (adRes.data) {
        setAd(adRes.data);
        if (adRes.data.images && adRes.data.images.length > 0) setActiveImage(adRes.data.images[0]);

        // Fetch related ads
        const { data: relatedData } = await supabase
          .from("ads")
          .select("*")
          .eq("category_slug", adRes.data.category_slug) 
          .not("id", "eq", adRes.data.id)
          .limit(4);
        
        setRelatedAds(relatedData || []);
      }
      setLoading(false);
    };

    fetchFullData();
  }, [params.id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center">Loading...</div>;
  if (!ad) return <div className="min-h-[60vh] flex items-center justify-center">Ad Not Found</div>;

  // Helper to get readable attribute values
  const getAttributeDisplay = (key: string, value: any) => {
    if (key === 'make_id') return { label: 'Make', val: makesMap[Number(value)] || value };
    if (key === 'model_id') return { label: 'Model', val: modelsMap[Number(value)] || value };
    return { label: key.replace('_', ' '), val: String(value) };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white p-4 shadow-sm border border-gray-100">
                <img src={activeImage || ""} alt={ad.title} className="w-full h-96 object-contain rounded-2xl" />
                <div className="flex gap-2 mt-4 overflow-x-auto">
                    {ad.images?.map((img: string, idx: number) => (
                        <button key={idx} onClick={() => setActiveImage(img)} className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${activeImage === img ? 'border-[#FF6321]' : 'border-transparent'}`}>
                            <img src={img} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-2xl font-bold">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{ad.description}</p>
              
              {ad.attributes && Object.keys(ad.attributes).length > 0 && (
                <div className="border-t pt-6">
                    <h3 className="font-bold text-gray-900 mb-4">Specifications</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(ad.attributes).map(([key, value]) => {
                          const { label, val } = getAttributeDisplay(key, value);
                          return (
                            <div key={key} className="bg-gray-50 p-3 rounded-lg">
                                <span className="block text-xs text-gray-500 capitalize">{label}</span>
                                <span className="font-semibold">{val}</span>
                            </div>
                          );
                        })}
                    </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 sticky top-24">
              <h1 className="text-4xl font-black text-[#FF6321] mb-2">EGP {Number(ad.price).toLocaleString()}</h1>
              <h2 className="text-2xl font-bold mb-4">{ad.title}</h2>
              
              <div className="flex items-center gap-2 text-gray-500 mb-6">
                <MapPin size={18} /> {ad.location}
              </div>

              <div className="space-y-3">
                <a href={`tel:${ad.seller_phone}`} className="w-full flex items-center justify-center gap-3 bg-[#FF6321] py-4 rounded-2xl font-bold text-white hover:bg-[#e85a1e]">
                  <Phone size={20} /> Call Seller
                </a>
                <a href={`https://wa.me/${ad.seller_phone}`} target="_blank" className="w-full flex items-center justify-center gap-3 border-2 border-[#FF6321] py-4 rounded-2xl font-bold text-[#FF6321] hover:bg-orange-50">
                  <MessageCircle size={20} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {relatedAds.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Related Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedAds.map(item => (
              <AdCard 
                key={item.id} 
                {...item} 
                price={String(item.price)} 
                category={item.category_slug} 
                imageUrl={item.images?.[0]} 
                status={item.status}
                specs={extractSpecs(item.attributes)}
                makeName={item.attributes?.make_id ? makesMap[item.attributes.make_id] : undefined}
                modelName={item.attributes?.model_id ? modelsMap[item.attributes.model_id] : undefined}
                postedDate={item.created_at ? new Date(item.created_at).toLocaleDateString() : undefined}
              />
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}