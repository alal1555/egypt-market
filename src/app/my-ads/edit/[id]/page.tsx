"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { X, Upload } from "lucide-react";
import DynamicAttributes from "@/components/DynamicAttributes";
import { cleanAdAttributes } from "@/lib/utils";
import { useTranslation } from "@/i18n/LocaleProvider";

interface EditAdProps {
  params: Promise<{ id: string }>;
}

export default function EditAdPage({ params }: EditAdProps) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<any>({
    title: "",
    price: "",
    location: "",
    description: "",
    category_slug: "",
    attributes: {},
    seller_phone: "",
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [makes, setMakes] = useState<{ id: number; name: string }[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [adStatus, setAdStatus] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      setLoadingMakes(true);
      const { data: makesData } = await supabase.from("makes").select("*").order("name");
      if (makesData) setMakes(makesData);
      setLoadingMakes(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("id", id)
        .single();

      if (error || data.user_id !== user.id) {
        alert(t("editAd.unauthorized"));
        router.push("/my-ads");
        return;
      }

      setFormData({
        title: data.title,
        price: String(data.price),
        location: data.location,
        description: data.description || "",
        category_slug: data.category_slug,
        attributes: data.attributes || {},
        seller_phone: data.seller_phone || "",
      });
      setExistingImages(data.images || []);
      setAdStatus(data.status);
      setLoading(false);
    }
    init();
  }, [id, router, t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setNewImageFiles([...newImageFiles, ...Array.from(e.target.files)]);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setUpdating(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of newImageFiles) {
        const filePath = `ad-photos/${userId}/${Date.now()}-${file.name}`;
        await supabase.storage.from("ad-images").upload(filePath, file);
        const { data } = supabase.storage.from("ad-images").getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      const { error } = await supabase
        .from("ads")
        .update({
          title: formData.title,
          price: Number(formData.price),
          location: formData.location,
          description: formData.description,
          attributes: cleanAdAttributes(formData.attributes),
          seller_phone: formData.seller_phone,
          images: [...existingImages, ...uploadedUrls],
          status: "pending",
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      alert(
        adStatus === "active" ? t("editAd.savedActive") : t("editAd.savedPending"),
      );
      router.push("/my-ads");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("postAd.somethingWrong");
      alert(t("editAd.updateFailed") + message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-20">{t("common.loading")}</div>;

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-2xl border shadow-sm">
      <h1 className="text-3xl font-bold mb-4">{t("editAd.title")}</h1>
      {adStatus === "active" && (
        <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("editAd.pendingWarning")}
        </p>
      )}
      <form onSubmit={handleUpdate} className="space-y-6">
        <input
          className="w-full px-4 py-3 border rounded-xl"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={t("editAd.titlePlaceholder")}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            className="px-4 py-3 border rounded-xl"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder={t("editAd.pricePlaceholder")}
            required
          />
          <input
            className="px-4 py-3 border rounded-xl"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder={t("editAd.locationPlaceholder")}
            required
          />
        </div>

        <textarea
          className="w-full px-4 py-3 border rounded-xl"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t("editAd.descriptionPlaceholder")}
          rows={4}
        />

        <input
          type="tel"
          className="w-full px-4 py-3 border rounded-xl"
          value={formData.seller_phone}
          onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })}
          placeholder={t("editAd.phonePlaceholder")}
          required
        />

        <div className="p-4 bg-gray-50 rounded-xl border">
          <h3 className="font-bold text-gray-700 mb-4">{t("editAd.specifications")}</h3>
          <DynamicAttributes
            category={formData.category_slug}
            formData={formData}
            setFormData={setFormData}
            makes={makes}
            loadingMakes={loadingMakes}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">{t("editAd.images")}</label>
          <div className="grid grid-cols-3 gap-4">
            {existingImages.map((url, i) => (
              <div key={`exist-${i}`} className="relative h-24 border rounded-xl overflow-hidden">
                <img src={url} className="w-full h-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {newImageFiles.map((file, i) => (
              <div key={`new-${i}`} className="h-24 border border-dashed rounded-xl flex items-center justify-center text-xs text-gray-500">
                {t("editAd.newImage")}
              </div>
            ))}
            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50">
              <Upload size={20} /> <span className="text-xs">{t("editAd.add")}</span>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        <button type="submit" disabled={updating} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700">
          {updating ? t("editAd.saving") : t("editAd.update")}
        </button>
      </form>
    </div>
  );
}
