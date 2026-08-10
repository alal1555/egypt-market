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
  formatWalletError,
} from "@/lib/wallet";

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

  const [makes, setMakes] = useState<{ id: number; name: string }[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    price: 0,
    location: "",
    description: "",
    attributes: { make_id: "" },
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
      if (!user) throw new Error("You must be logged in to post an ad.");

      const canPost = await checkCanPostAd(supabase, user.id);
      if (!canPost.ok) {
        throw new Error(formatWalletError(canPost.error));
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
          attributes: formData.attributes,
          images: uploadedUrls,
          seller_phone: sellerPhone,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError || !ad) throw insertError || new Error("Failed to create ad");

      const consumed = await consumeAdCredit(supabase, ad.id);
      if (!consumed.ok) {
        await supabase.from("ads").delete().eq("id", ad.id);
        throw new Error(formatWalletError(consumed.error));
      }

      alert("Ad submitted for approval!");
      router.push("/my-ads");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      alert("Error: " + message);
    } finally {
      setUploading(false);
    }
  };

  const renderCreditBanner = () => {
    if (checkingCredits) {
      return (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border text-sm text-gray-500 text-center">
          Checking your ad credits…
        </div>
      );
    }
    if (!postCheck?.ok) {
      return (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <p className="font-bold mb-1">Cannot post yet</p>
          <p>{formatWalletError(postCheck?.error)}</p>
          {postCheck?.error === "phone_not_verified" && (
            <Link href="/profile" className="inline-block mt-2 font-bold text-[#FF6321] underline">
              Verify phone to unlock wallet balance →
            </Link>
          )}
        </div>
      );
    }
    if (postCheck.type === "admin_waiver") {
      return (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          Admin account — posting is free.
        </div>
      );
    }
    if (postCheck.type === "free_ad") {
      return (
        <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-100 text-sm text-gray-700">
          This ad will use <strong>1 free ad</strong> ({postCheck.free_ads_remaining} free remaining).
          {typeof postCheck.balance === "number" && postCheck.balance > 0 && (
            <span> Balance: {postCheck.balance} EGP.</span>
          )}
        </div>
      );
    }
    return (
      <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-100 text-sm text-gray-700">
        This ad costs <strong>{AD_POST_PRICE_EGP} EGP</strong> from your balance ({postCheck.balance} EGP left).
      </div>
    );
  };

  const canSubmit = postCheck?.ok && !uploading;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-xl rounded-2xl my-10 border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Post Your Ad</h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        Standard ad: {AD_POST_PRICE_EGP} EGP · New users get {WELCOME_FREE_ADS} free ads · Verify
        phone for {WELCOME_BALANCE_EGP} EGP wallet balance
      </p>

      {renderCreditBanner()}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 uppercase">Main Category</label>
            <select
              value={mainCategory}
              onChange={(e) => {
                setMainCategory(e.target.value);
                setCategory("");
              }}
              className="w-full p-4 border rounded-lg bg-white"
            >
              <option value="">Select Main Category</option>
              {CATEGORY_CONFIG.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 uppercase">Sub-category</label>
            <select
              value={category}
              disabled={!mainCategory}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 border rounded-lg bg-white"
            >
              <option value="">Select Sub-category</option>
              {subCategories.map((subSlug) => {
                const mainCat = CATEGORY_CONFIG.find((c) => c.slug === mainCategory);
                const sub = mainCat?.subs.find((s) => s.slug === subSlug);
                return (
                  <option key={subSlug} value={subSlug}>
                    {sub ? sub.name : subSlug}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {category && (
          <div className="p-6 bg-orange-50 rounded-xl border border-orange-100">
            <h3 className="font-bold text-orange-800 mb-4 uppercase text-sm tracking-widest">
              Specific Details
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
          <label className="block text-lg font-semibold text-gray-700">Title</label>
          <input
            type="text"
            placeholder="What are you selling?"
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-gray-700">Photos</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-500 transition cursor-pointer relative bg-gray-50">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <p className="text-gray-500 font-medium">
              {images.length > 0 ? `${images.length} images selected` : "Click to upload photos"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Price (EGP)"
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            required
          />
          <input
            type="text"
            placeholder="Location (e.g. Maadi, Cairo)"
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-semibold text-gray-700">Contact Phone</label>
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
          placeholder="Detailed description..."
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
          {uploading ? "Publishing..." : "Post Ad Now"}
        </button>
      </form>
    </div>
  );
}
