"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DynamicAttributes from "@/components/DynamicAttributes";
import { CATEGORY_CONFIG, getCategoryGroups } from "@/constants/categoryConfig";
import {
  AD_POST_PRICE_EGP,
  CanPostResult,
  WELCOME_BALANCE_EGP,
  WELCOME_FREE_ADS,
  checkCanPostAd,
  consumeAdCredit,
} from "@/lib/wallet";
import { cleanAdAttributes } from "@/lib/utils";
import { useTranslation } from "@/i18n/LocaleProvider";
import { localizedMainCategoryName, localizedSubCategoryName } from "@/i18n/catalog";
import { formatWalletErrorLocalized } from "@/i18n/walletErrors";

export default function PostAdPage() {
  const router = useRouter();

  const categoryGroups = useMemo(() => getCategoryGroups(), []);

  const [mainCategory, setMainCategory] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sellerPhone, setSellerPhone] = useState("");
  const [postCheck, setPostCheck] = useState<CanPostResult | null>(null);
  const [checkingCredits, setCheckingCredits] = useState(true);
  const { t, locale } = useTranslation();

  const [makes, setMakes] = useState<{ id: number; name: string }[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    price: 0,
    location: "",
    description: "",
    attributes: {} as Record<string, string>,
  });

  const subCategories = useMemo(() => {
    return mainCategory ? categoryGroups[mainCategory] || [] : [];
  }, [mainCategory, categoryGroups]);

  useEffect(() => {
    async function loadMakes() {
      setLoadingMakes(true);
      const { data } = await supabase.from("makes").select("*").order("name");
      if (data) setMakes(data);
      setLoadingMakes(false);
    }
    async function loadUserPhone() {
      const { data: { user } } = await supabase.auth.getUser();
      const phone = user?.user_metadata?.phone_number;
      if (phone) setSellerPhone(phone);
    }
    async function loadPostCheck() {
      setCheckingCredits(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPostCheck({ ok: false, error: "not_authenticated" });
        setCheckingCredits(false);
        return;
      }
      const check = await checkCanPostAd(supabase, user.id);
      setPostCheck(check);
      setCheckingCredits(false);
    }
    loadMakes();
    loadUserPhone();
    loadPostCheck();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages([...images, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("postAd.mustLogin"));

      const canPost = await checkCanPostAd(supabase, user.id);
      if (!canPost.ok) {
        throw new Error(formatWalletErrorLocalized(canPost.error, t));
      }

      const uploadedUrls = [];
      for (const file of images) {
        const filePath = `ad-photos/${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("ad-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("ad-images").getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      const { data: ad, error: insertError } = await supabase
        .from("ads")
        .insert({
          user_id: user.id,
          title: formData.title,
          price: Number(formData.price),
          location: formData.location,
          description: formData.description,
          category_slug: category,
          attributes: cleanAdAttributes(formData.attributes),
          images: uploadedUrls,
          seller_phone: sellerPhone,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError || !ad) throw insertError || new Error(t("postAd.createFailed"));

      const consumed = await consumeAdCredit(supabase, ad.id);
      if (!consumed.ok) {
        await supabase.from("ads").delete().eq("id", ad.id);
        throw new Error(formatWalletErrorLocalized(consumed.error, t));
      }

      alert(t("postAd.submitted"));
      router.push("/my-ads");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("postAd.somethingWrong");
      alert(t("postAd.errorPrefix") + message);
    } finally {
      setUploading(false);
    }
  };

  const renderCreditBanner = () => {
    if (checkingCredits) {
      return (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border text-sm text-gray-500 text-center">
          {t("postAd.checkingCredits")}
        </div>
      );
    }
    if (!postCheck?.ok) {
      return (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <p className="font-bold mb-1">{t("postAd.cannotPost")}</p>
          <p>{formatWalletErrorLocalized(postCheck?.error, t)}</p>
          {postCheck?.error === "phone_not_verified" && (
            <Link href="/profile" className="inline-block mt-2 font-bold text-[#FF6321] underline">
              {t("postAd.verifyPhoneLink")}
            </Link>
          )}
        </div>
      );
    }
    if (postCheck.type === "admin_waiver") {
      return (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          {t("postAd.adminFree")}
        </div>
      );
    }
    if (postCheck.type === "free_ad") {
      return (
        <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-100 text-sm text-gray-700">
          {t("postAd.useFreeAd", { remaining: postCheck.free_ads_remaining ?? 0 })}
          {typeof postCheck.balance === "number" && postCheck.balance > 0 && (
            <span>{t("postAd.balanceLeft", { balance: postCheck.balance })}</span>
          )}
        </div>
      );
    }
    return (
      <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-100 text-sm text-gray-700">
        {t("postAd.costsFromBalance", { price: AD_POST_PRICE_EGP, balance: postCheck.balance ?? 0 })}
      </div>
    );
  };

  const canSubmit = postCheck?.ok && !uploading;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-xl rounded-2xl my-10 border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">{t("postAd.title")}</h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        {t("postAd.pricingHint", {
          price: AD_POST_PRICE_EGP,
          freeAds: WELCOME_FREE_ADS,
          welcomeBalance: WELCOME_BALANCE_EGP,
        })}{" "}
        <Link href="/pricing" className="text-[#FF6321] font-bold hover:underline">
          {t("postAd.fullPriceList")}
        </Link>
      </p>

      {renderCreditBanner()}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 uppercase">{t("postAd.mainCategory")}</label>
            <select
              value={mainCategory}
              onChange={(e) => {
                setMainCategory(e.target.value);
                setCategory("");
              }}
              className="w-full p-4 border rounded-lg bg-white"
            >
              <option value="">{t("postAd.selectMain")}</option>
              {CATEGORY_CONFIG.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {localizedMainCategoryName(cat.slug, locale)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 uppercase">{t("postAd.subCategory")}</label>
            <select
              value={category}
              disabled={!mainCategory}
              onChange={(e) => {
                setCategory(e.target.value);
                setFormData((prev) => ({ ...prev, attributes: {} }));
              }}
              className="w-full p-4 border rounded-lg bg-white"
            >
              <option value="">{t("postAd.selectSub")}</option>
              {subCategories.map((subSlug) => (
                <option key={subSlug} value={subSlug}>
                  {localizedSubCategoryName(subSlug, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {category && (
          <div className="p-6 bg-orange-50 rounded-xl border border-orange-100">
            <h3 className="font-bold text-orange-800 mb-4 uppercase text-sm tracking-widest">
              {t("postAd.specificDetails")}
            </h3>
            <DynamicAttributes
              category={category}
              formData={formData}
              setFormData={setFormData}
              makes={makes}
              loadingMakes={loadingMakes}
            />
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-700">{t("postAd.titleLabel")}</label>
          <input
            type="text"
            placeholder={t("postAd.titlePlaceholder")}
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-700">{t("postAd.photos")}</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-500 transition cursor-pointer relative bg-gray-50">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <p className="text-gray-500 font-medium">
              {images.length > 0 ? t("postAd.imagesSelected", { count: images.length }) : t("postAd.uploadPhotos")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            placeholder={t("postAd.pricePlaceholder")}
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            required
          />
          <input
            type="text"
            placeholder={t("postAd.locationPlaceholder")}
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-semibold text-gray-700">{t("postAd.contactPhone")}</label>
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={sellerPhone}
            onChange={(e) => setSellerPhone(e.target.value)}
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            required
          />
        </div>

        <textarea
          placeholder={t("postAd.descriptionPlaceholder")}
          rows={4}
          className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl font-bold text-white text-xl transition-all ${
            !canSubmit
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-600 hover:bg-orange-700 hover:shadow-lg active:scale-95"
          }`}
        >
          {uploading ? t("postAd.publishing") : t("postAd.postNow")}
        </button>
      </form>
    </div>
  );
}
