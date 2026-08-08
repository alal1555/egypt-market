/** Normalize phone for tel: / wa.me links (Egypt: 20 + number). */
export function formatPhoneForLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits.length === 10 ? `20${digits}` : digits;
}

/** Sort alphabetically, with "Other" always last (vehicle model dropdowns). */
export function sortWithOtherLast<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aOther = a.name.toLowerCase() === "other";
    const bOther = b.name.toLowerCase() === "other";
    if (aOther && !bOther) return 1;
    if (!aOther && bOther) return -1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export const extractSpecs = (attributes: any) => {
  if (!attributes || typeof attributes !== 'object') return {};

  // If this is a vehicle category (check for specific keys), 
  // we return the formatted/extracted version
  if (attributes.year || attributes.mileage || attributes.make_id || attributes.model_id) {
    return {
      year: attributes.year,
      mileage: attributes.mileage,
      condition: attributes.condition,
      transmission: attributes.transmission,
      make_id: attributes.make_id,
      model_id: attributes.model_id
    };
  }

  // For Pets (Dogs, Cats, Birds, Fish, etc.) and other categories,
  // return all attributes as-is so the AdCard can render them dynamically.
  return attributes;
};

// npx next dev -H 0.0.0.0







// this coming code is for supabase sql to fix the numeric attribute min and max
// UPDATE ads
// SET attributes = jsonb_set(
//   attributes, 
//   '{bedrooms}', 
//   to_jsonb((attributes->>'bedrooms')::int)
// )
// WHERE (attributes->>'bedrooms') ~ '^[0-9]+$';
// -- Repeat this for your other numeric fields (mileage, year, etc.)
// -- Just replace '{area}' and 'area' with the correct field name