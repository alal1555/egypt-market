import { supabase } from "@/lib/supabase";

export async function fetchMakes() {
  const { data, error } = await supabase
    .from("makes")
    .select("*")
    .order("name");
  return { data, error };
}

export async function fetchModels(makeId: number) {
  const { data, error } = await supabase
    .from("models")
    .select("*")
    .eq("make_id", makeId)
    .order("name");
  return { data, error };
}