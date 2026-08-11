"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdCard from "@/components/AdCard";
import { Heart } from "lucide-react";
import { extractSpecs } from "@/lib/utils";
import { useTranslation } from "@/i18n/LocaleProvider";

interface Ad {
  id: string;
  title: string;
  price: number;
  location: string;
  category_slug: string;
  images: string[];
  attributes?: any;
  created_at?: string;
}

export default function FavoritesPage() {
  const [favoriteAds, setFavoriteAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Maps for Make and Model name lookup
  const [makesMap, setMakesMap] = useState<Record<number, string>>({});
  const [modelsMap, setModelsMap] = useState<Record<number, string>>({});
  const { t } = useTranslation();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      // Fetch favorites, makes, and models in parallel
      const [favRes, makesRes, modelsRes] = await Promise.all([
        supabase
          .from("favorites")
          .select(`
            ad_id,
            ads (
              id, title, price, location, category_slug, images, attributes, created_at
            )
          `)
          .eq("user_id", session.user.id),
        supabase.from("makes").select("id, name"),
        supabase.from("models").select("id, name")
      ]);

      // Process Favorites
      if (favRes.data) {
        const extractedAds = favRes.data
          .map((item: any) => item.ads)
          .filter((ad) => ad !== null);
        setFavoriteAds(extractedAds);
      }

      // Process Maps for performance
      if (makesRes.data) setMakesMap(Object.fromEntries(makesRes.data.map(m => [m.id, m.name])));
      if (modelsRes.data) setModelsMap(Object.fromEntries(modelsRes.data.map(m => [m.id, m.name])));
      
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6321] mx-auto"></div>
        <p className="text-gray-500 mt-4 font-medium">{t("favorites.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-gray-50 max-w-md mx-auto p-8 rounded-2xl border border-dashed">
          <Heart size={40} className="text-gray-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800">{t("favorites.accessDenied")}</h2>
          <p className="text-gray-500 text-sm mt-1 mb-4">{t("favorites.loginRequired")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 border-b pb-5 mb-8">
        <Heart className="text-red-500 fill-red-500" size={24} />
        <h1 className="text-2xl font-black text-gray-900">{t("favorites.savedTitle")}</h1>
        <span className="text-gray-400 font-normal text-sm bg-gray-100 px-2.5 py-0.5 rounded-full ml-1">
          {t("favorites.items", { count: favoriteAds.length })}
        </span>
      </div>

      {favoriteAds.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed w-full max-w-xl mx-auto">
          <Heart size={36} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">{t("favorites.emptyBoard")}</p>
          <p className="text-xs text-gray-400 mt-1">{t("favorites.emptyHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 w-full">
          {favoriteAds.map((ad) => (
            <AdCard
              key={ad.id}
              id={ad.id}
              title={ad.title}
              price={String(ad.price)}
              location={ad.location}
              category={ad.category_slug}
              imageUrl={ad.images?.[0]}
              currentUserId={user.id}
              // This now handles both Vehicles (formatted) and Pets (dynamic all-attributes)
              specs={extractSpecs(ad.attributes)}
              postedDate={ad.created_at ? new Date(ad.created_at).toLocaleDateString() : undefined}
              // Vehicle-specific lookups (will be undefined for pets/others)
              makeName={ad.attributes?.make_id ? makesMap[ad.attributes.make_id] : undefined}
              modelName={ad.attributes?.model_id ? modelsMap[ad.attributes.model_id] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}