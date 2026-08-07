"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { X, Upload } from "lucide-react";
import DynamicAttributes from "@/components/DynamicAttributes";

interface EditAdProps {
  params: Promise<{ id: string }>;
}

export default function EditAdPage({ params }: EditAdProps) {
  const { id } = use(params);
  const router = useRouter();

  // Data States
  const [formData, setFormData] = useState<any>({
    title: "",
    price: "",
    location: "",
    description: "",
    category_slug: "",
    attributes: {},
    seller_phone: "",
  });

  // Image States
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [makes, setMakes] = useState<{ id: number; name: string }[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // 1. Fetch Makes for the dropdown
      setLoadingMakes(true);
      const { data: makesData } = await supabase.from("makes").select("*").order("name");
      if (makesData) setMakes(makesData);
      setLoadingMakes(false);

      // 2. Fetch User and Ad
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("id", id)
        .single();

      if (error || data.user_id !== user.id) {
        alert("Unauthorized or not found");
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
      setLoading(false);
    }
    init();
  }, [id, router]);

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
          attributes: formData.attributes,
          seller_phone: formData.seller_phone,
          images: [...existingImages, ...uploadedUrls],
        })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      alert("Updated successfully! 🎉");
      router.push("/my-ads");
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-2xl border shadow-sm">
      <h1 className="text-3xl font-bold mb-8">Edit Listing</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        
        {/* Title */}
        <input className="w-full px-4 py-3 border rounded-xl" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Title" required />
        
        {/* Price & Location */}
        <div className="grid grid-cols-2 gap-4">
            <input className="px-4 py-3 border rounded-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Price" required />
            <input className="px-4 py-3 border rounded-xl" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Location" required />
        </div>
        
        {/* Description */}
        <textarea className="w-full px-4 py-3 border rounded-xl" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Description" rows={4} />

        <input
          type="tel"
          className="w-full px-4 py-3 border rounded-xl"
          value={formData.seller_phone}
          onChange={(e) => setFormData({...formData, seller_phone: e.target.value})}
          placeholder="Contact Phone (01XXXXXXXXX)"
          required
        />
        
        {/* Dynamic Attributes */}
        <div className="p-4 bg-gray-50 rounded-xl border">
            <h3 className="font-bold text-gray-700 mb-4">Specifications</h3>
            <DynamicAttributes 
                category={formData.category_slug} 
                formData={formData} 
                setFormData={setFormData}
                makes={makes}
                loadingMakes={loadingMakes}
            />
        </div>

        {/* Image Management */}
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Images</label>
            <div className="grid grid-cols-3 gap-4">
                {existingImages.map((url, i) => (
                    <div key={`exist-${i}`} className="relative h-24 border rounded-xl overflow-hidden">
                        <img src={url} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X size={14} /></button>
                    </div>
                ))}
                {newImageFiles.map((file, i) => (
                    <div key={`new-${i}`} className="h-24 border border-dashed rounded-xl flex items-center justify-center text-xs text-gray-500">New Image</div>
                ))}
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50">
                    <Upload size={20} /> <span className="text-xs">Add</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
            </div>
        </div>

        <button type="submit" disabled={updating} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700">
          {updating ? "Saving..." : "Update Ad"}
        </button>
      </form>
    </div>
  );
}