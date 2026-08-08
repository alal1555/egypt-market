// src/constants/categoryConfig.ts

export type AttributeField = {
  label: string;
  key: string;
  type: "text" | "number" | "select" | "toggle" | "range";
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
};

export type SubCategory = {
  name: string;
  slug: string;
  attributes: AttributeField[];
};

export type MainCategory = {
  name: string;
  slug: string;
  subs: SubCategory[];
};

const CONDITION = ["New", "Used", "Refurbished"];
const VEHICLE_CONDITION = ["New", "Used"];
const FUEL = ["Gasoline", "Diesel", "Electric", "Hybrid"];
const TRANSMISSION = ["Automatic", "Manual"];
const METHOD = ["Online", "In-person", "Both"];
const FINISHING = ["Core & Shell", "Semi-Finished", "Fully Finished"];
const RENTAL_PERIOD = ["Daily", "Monthly", "Yearly"];
const COMMERCIAL_TYPE = ["Office", "Shop", "Warehouse", "Clinic", "Other"];
const LAND_ZONING = ["Residential", "Commercial", "Agricultural"];
const PHONE_BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Oppo",
  "Huawei",
  "Realme",
  "Infinix",
  "Nokia",
  "Other",
];
const LAPTOP_BRANDS = ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Other"];
const APPLIANCE_TYPES = [
  "Refrigerator",
  "Air Conditioner",
  "Washing Machine",
  "Dryer",
  "Microwave",
  "Oven",
  "Water Heater",
  "Other",
];
const FURNITURE_TYPES = ["Sofa", "Bed", "Table", "Chair", "Wardrobe", "Desk", "Other"];
const SERVICE_TYPES = [
  "Cleaning",
  "Moving",
  "AC Repair",
  "Plumbing",
  "Electrical",
  "Tutoring",
  "Other",
];

const carAttrs = (rent = false): AttributeField[] => {
  const base: AttributeField[] = [
    { label: "Make", key: "make_id", type: "select" },
    { label: "Model", key: "model_id", type: "select" },
    { label: "Year", key: "year", type: "range", min: 1990 },
    { label: "Transmission", key: "transmission", type: "select", options: [...TRANSMISSION] },
    { label: "Fuel Type", key: "fuel_type", type: "select", options: [...FUEL] },
  ];
  if (rent) {
    return [
      ...base,
      { label: "With Driver", key: "with_driver", type: "toggle" },
    ];
  }
  return [
    ...base,
    { label: "Mileage (km)", key: "mileage", type: "range", min: 0 },
    { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
  ];
};

export const CATEGORY_CONFIG: MainCategory[] = [
  {
    name: "Vehicles for Sale",
    slug: "vehicles-sale",
    subs: [
      { name: "Cars", slug: "vs_cars", attributes: carAttrs() },
      {
        name: "Buses",
        slug: "vs_buses",
        attributes: [
          {
            label: "Size",
            key: "size",
            type: "select",
            options: ["Micro Bus", "Mini Bus", "Full-Size Bus", "Other"],
          },
          { label: "Year", key: "year", type: "range", min: 1990 },
          { label: "Mileage (km)", key: "mileage", type: "range", min: 0 },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
          { label: "Transmission", key: "transmission", type: "select", options: [...TRANSMISSION] },
          { label: "Fuel Type", key: "fuel_type", type: "select", options: [...FUEL] },
        ],
      },
      {
        name: "Trucks",
        slug: "vs_trucks",
        attributes: [
          { label: "Make", key: "brand", type: "text", placeholder: "e.g. Mercedes, Isuzu" },
          { label: "Year", key: "year", type: "range", min: 1990 },
          { label: "Capacity (Tons)", key: "capacity", type: "range", min: 0 },
          { label: "Transmission", key: "transmission", type: "select", options: [...TRANSMISSION] },
          { label: "Fuel Type", key: "fuel_type", type: "select", options: [...FUEL] },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
        ],
      },
      {
        name: "Motorcycles & Scooters",
        slug: "vs_motorcycles",
        attributes: [
          { label: "Brand", key: "brand", type: "text", placeholder: "e.g. Honda, Vespa" },
          { label: "Year", key: "year", type: "range", min: 1990 },
          { label: "Engine (cc)", key: "engine_cc", type: "range", min: 50 },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
        ],
      },
      {
        name: "Spare Parts",
        slug: "vs_parts",
        attributes: [
          { label: "Part Type", key: "part_type", type: "text", placeholder: "e.g. Engine, Tires" },
          { label: "For Make", key: "for_make", type: "text", placeholder: "e.g. Toyota" },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
        ],
      },
    ],
  },
  {
    name: "Vehicles for Rent",
    slug: "vehicles-rent",
    subs: [
      { name: "Cars", slug: "vr_cars", attributes: carAttrs(true) },
      {
        name: "Buses",
        slug: "vr_buses",
        attributes: [
          { label: "Year", key: "year", type: "range", min: 1990 },
          { label: "Fuel Type", key: "fuel_type", type: "select", options: ["Diesel", "Gasoline"] },
          { label: "With Driver", key: "with_driver", type: "toggle" },
        ],
      },
      {
        name: "Trucks",
        slug: "vr_trucks",
        attributes: [
          { label: "Year", key: "year", type: "range", min: 1990 },
          { label: "Capacity (Tons)", key: "capacity", type: "range", min: 0 },
          { label: "With Driver", key: "with_driver", type: "toggle" },
        ],
      },
      {
        name: "Motorcycles & Scooters",
        slug: "vr_motorcycles",
        attributes: [
          { label: "Year", key: "year", type: "range", min: 1990 },
          { label: "Engine (cc)", key: "engine_cc", type: "range", min: 50 },
        ],
      },
    ],
  },
  {
    name: "Watercraft",
    slug: "watercraft",
    subs: [
      {
        name: "Power Boats & Motorboats",
        slug: "wc_power",
        attributes: [
          { label: "Year", key: "year", type: "range", min: 1980 },
          { label: "Length (m)", key: "length_m", type: "range", min: 1 },
          { label: "Engine Type", key: "engine_type", type: "select", options: ["Outboard", "Inboard", "Jet", "None"] },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
        ],
      },
      {
        name: "Yachts",
        slug: "wc_yachts",
        attributes: [
          { label: "Year", key: "year", type: "range", min: 1980 },
          { label: "Length (m)", key: "length_m", type: "range", min: 1 },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
        ],
      },
      {
        name: "Fishing Boats",
        slug: "wc_fishing",
        attributes: [
          { label: "Year", key: "year", type: "range", min: 1980 },
          { label: "Length (m)", key: "length_m", type: "range", min: 1 },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
        ],
      },
      {
        name: "Jet Skis & WaveRunners",
        slug: "wc_jetski",
        attributes: [
          { label: "Year", key: "year", type: "range", min: 1990 },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
        ],
      },
      {
        name: "Inflatables & RIBs",
        slug: "wc_inflatables",
        attributes: [
          { label: "Length (m)", key: "length_m", type: "range", min: 1 },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
        ],
      },
      {
        name: "Non-Motorized",
        slug: "wc_nonmotor",
        attributes: [
          { label: "Length (m)", key: "length_m", type: "range", min: 1 },
          { label: "Condition", key: "condition", type: "select", options: [...VEHICLE_CONDITION] },
        ],
      },
    ],
  },
  {
    name: "Properties for Sale",
    slug: "prop-sale",
    subs: [
      {
        name: "Residential",
        slug: "ps_res",
        attributes: [
          { label: "Bedrooms", key: "bedrooms", type: "range", min: 0 },
          { label: "Bathrooms", key: "bathrooms", type: "range", min: 0 },
          { label: "Area (sqm)", key: "area", type: "range", min: 0 },
          { label: "Finishing", key: "finishing", type: "select", options: [...FINISHING] },
          { label: "In Compound", key: "in_compound", type: "toggle" },
        ],
      },
      {
        name: "Commercial",
        slug: "ps_com",
        attributes: [
          { label: "Type", key: "commercial_type", type: "select", options: [...COMMERCIAL_TYPE] },
          { label: "Area (sqm)", key: "area", type: "range", min: 0 },
          { label: "Finishing", key: "finishing", type: "select", options: [...FINISHING] },
        ],
      },
      {
        name: "Land",
        slug: "ps_land",
        attributes: [
          { label: "Area (sqm)", key: "area", type: "range", min: 0 },
          { label: "Zoning", key: "zoning", type: "select", options: [...LAND_ZONING] },
        ],
      },
    ],
  },
  {
    name: "Properties for Rent",
    slug: "prop-rent",
    subs: [
      {
        name: "Residential",
        slug: "pr_res",
        attributes: [
          { label: "Bedrooms", key: "bedrooms", type: "range", min: 0 },
          { label: "Bathrooms", key: "bathrooms", type: "range", min: 0 },
          { label: "Area (sqm)", key: "area", type: "range", min: 0 },
          { label: "Furnished", key: "furnished", type: "toggle" },
          { label: "Rental Period", key: "rental_period", type: "select", options: [...RENTAL_PERIOD] },
          { label: "In Compound", key: "in_compound", type: "toggle" },
        ],
      },
      {
        name: "Commercial",
        slug: "pr_com",
        attributes: [
          { label: "Type", key: "commercial_type", type: "select", options: [...COMMERCIAL_TYPE] },
          { label: "Area (sqm)", key: "area", type: "range", min: 0 },
          { label: "Rental Period", key: "rental_period", type: "select", options: [...RENTAL_PERIOD] },
        ],
      },
      {
        name: "Land",
        slug: "pr_land",
        attributes: [
          { label: "Area (sqm)", key: "area", type: "range", min: 0 },
          { label: "Zoning", key: "zoning", type: "select", options: [...LAND_ZONING] },
          { label: "Rental Period", key: "rental_period", type: "select", options: [...RENTAL_PERIOD] },
        ],
      },
    ],
  },
  {
    name: "Home & Furniture",
    slug: "home-furniture",
    subs: [
      {
        name: "Furniture",
        slug: "home_furniture",
        attributes: [
          { label: "Type", key: "furniture_type", type: "select", options: [...FURNITURE_TYPES] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
          { label: "Material", key: "material", type: "select", options: ["Wood", "Metal", "Fabric", "Mixed", "Other"] },
        ],
      },
      {
        name: "Home Appliances",
        slug: "home_appliances",
        attributes: [
          { label: "Type", key: "appliance_type", type: "select", options: [...APPLIANCE_TYPES] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Home Decor",
        slug: "home_decor",
        attributes: [
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Garden & Outdoor",
        slug: "home_garden",
        attributes: [
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
    ],
  },
  {
    name: "Pets",
    slug: "pets",
    subs: [
      {
        name: "Dogs",
        slug: "pets_dogs",
        attributes: [
          { label: "Breed", key: "breed", type: "text" },
          { label: "Age", key: "age", type: "text", placeholder: "e.g. 2 years" },
          { label: "Gender", key: "gender", type: "select", options: ["Male", "Female"] },
          { label: "Vaccinated", key: "vaccinated", type: "toggle" },
        ],
      },
      {
        name: "Cats",
        slug: "pets_cats",
        attributes: [
          { label: "Breed", key: "breed", type: "text" },
          { label: "Age", key: "age", type: "text", placeholder: "e.g. 1 year" },
          { label: "Gender", key: "gender", type: "select", options: ["Male", "Female"] },
          { label: "Vaccinated", key: "vaccinated", type: "toggle" },
        ],
      },
      {
        name: "Birds",
        slug: "pets_birds",
        attributes: [
          { label: "Species", key: "species", type: "text", placeholder: "e.g. Parrot, Canary" },
        ],
      },
      { name: "Fish", slug: "pets_fish", attributes: [{ label: "Type", key: "species", type: "text" }] },
      { name: "Reptiles", slug: "pets_reptiles", attributes: [{ label: "Species", key: "species", type: "text" }] },
      { name: "Small Animals", slug: "pets_small", attributes: [{ label: "Species", key: "species", type: "text" }] },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics",
    subs: [
      {
        name: "Mobiles & Tablets",
        slug: "elec_mobile",
        attributes: [
          { label: "Brand", key: "brand", type: "select", options: [...PHONE_BRANDS] },
          { label: "Storage", key: "storage", type: "select", options: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Laptops & Computers",
        slug: "elec_laptop",
        attributes: [
          { label: "Brand", key: "brand", type: "select", options: [...LAPTOP_BRANDS] },
          { label: "RAM", key: "ram", type: "select", options: ["8GB", "16GB", "32GB", "64GB"] },
          { label: "Storage", key: "storage", type: "select", options: ["256GB", "512GB", "1TB", "2TB"] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "TVs & Audio",
        slug: "elec_tv",
        attributes: [
          { label: "Screen Size (in)", key: "screen_size", type: "range", min: 10 },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Gaming",
        slug: "elec_gaming",
        attributes: [
          { label: "Platform", key: "platform", type: "select", options: ["PlayStation", "Xbox", "Nintendo", "PC", "Other"] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Cameras",
        slug: "elec_camera",
        attributes: [
          { label: "Brand", key: "brand", type: "select", options: ["Canon", "Nikon", "Sony", "GoPro", "Other"] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Other Electronics",
        slug: "elec_general",
        attributes: [
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Home Appliances",
        slug: "elec_home",
        attributes: [
          { label: "Type", key: "appliance_type", type: "select", options: [...APPLIANCE_TYPES] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    subs: [
      {
        name: "Clothing",
        slug: "fash_cloth",
        attributes: [
          { label: "Gender", key: "gender", type: "select", options: ["Men", "Women", "Unisex", "Kids"] },
          { label: "Size", key: "size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Shoes & Bags",
        slug: "fash_shoes",
        attributes: [
          { label: "Gender", key: "gender", type: "select", options: ["Men", "Women", "Unisex", "Kids"] },
          { label: "Size", key: "size", type: "text", placeholder: "e.g. 42, Medium" },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Accessories",
        slug: "fash_acc",
        attributes: [
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Watches & Jewelry",
        slug: "fash_watches",
        attributes: [
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
    ],
  },
  {
    name: "Kids & Baby",
    slug: "kids",
    subs: [
      {
        name: "Clothing",
        slug: "kids_cloth",
        attributes: [
          { label: "Age Group", key: "age_group", type: "select", options: ["0-1", "1-3", "3-6", "6-12", "12+"] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Toys & Games",
        slug: "kids_toys",
        attributes: [
          { label: "Age Group", key: "age_group", type: "select", options: ["0-3", "3-6", "6-12", "12+"] },
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
      {
        name: "Strollers & Gear",
        slug: "kids_gear",
        attributes: [
          { label: "Condition", key: "condition", type: "select", options: [...CONDITION] },
        ],
      },
    ],
  },
  {
    name: "Services",
    slug: "services",
    subs: [
      {
        name: "Home Services",
        slug: "svc_home",
        attributes: [
          { label: "Service Type", key: "service_type", type: "select", options: [...SERVICE_TYPES] },
        ],
      },
      {
        name: "Professional Services",
        slug: "svc_pro",
        attributes: [
          { label: "Service Type", key: "service_type", type: "select", options: ["Legal", "Accounting", "Design", "IT", "Other"] },
        ],
      },
    ],
  },
  {
    name: "Business",
    slug: "business",
    subs: [
      {
        name: "Job Opening",
        slug: "bus_opening",
        attributes: [
          { label: "Employment Type", key: "employment_type", type: "select", options: ["Full-time", "Part-time", "Contract", "Internship"] },
          { label: "Remote", key: "remote", type: "toggle" },
          { label: "Experience (years)", key: "experience_years", type: "range", min: 0 },
        ],
      },
      {
        name: "Job Seeker",
        slug: "bus_seeker",
        attributes: [
          { label: "Field", key: "field", type: "text", placeholder: "e.g. Marketing, Engineering" },
          { label: "Experience (years)", key: "experience_years", type: "range", min: 0 },
          { label: "Open to Remote", key: "remote", type: "toggle" },
        ],
      },
    ],
  },
  {
    name: "Education & Courses",
    slug: "education",
    subs: [
      {
        name: "Languages",
        slug: "lang",
        attributes: [
          {
            label: "Language",
            key: "language",
            type: "select",
            options: [
              "Arabic",
              "Bengali",
              "Chinese",
              "English",
              "French",
              "Hindi",
              "Italian",
              "Japanese",
              "Korean",
              "Portuguese",
              "Russian",
              "Spanish",
              "Other",
            ],
          },
          { label: "Method", key: "method", type: "select", options: [...METHOD] },
        ],
      },
      {
        name: "Educational Subjects",
        slug: "edu_subject",
        attributes: [
          {
            label: "Subject",
            key: "subject",
            type: "select",
            options: ["Biology", "Chemistry", "Geography", "History", "Mathematics", "Physics", "Other"],
          },
          {
            label: "Level",
            key: "level",
            type: "select",
            options: ["Primary", "Elementary", "Secondary", "University"],
          },
          { label: "Method", key: "method", type: "select", options: [...METHOD] },
        ],
      },
      {
        name: "Musical Instruments",
        slug: "music",
        attributes: [
          {
            label: "Instrument",
            key: "instrument",
            type: "select",
            options: [
              "Accordion",
              "Cello",
              "Clarinet",
              "Drums",
              "Flute",
              "Guitar",
              "Organ",
              "Piano",
              "Saxophone",
              "Trumpet",
              "Violin",
              "Vocal / Singing",
              "Xylophone",
              "Other",
            ],
          },
          { label: "Method", key: "method", type: "select", options: [...METHOD] },
        ],
      },
      {
        name: "Skills & IT",
        slug: "edu_skills",
        attributes: [
          {
            label: "Skill",
            key: "skill",
            type: "select",
            options: ["Programming", "Design", "Marketing", "Business", "Other"],
          },
          { label: "Method", key: "method", type: "select", options: [...METHOD] },
        ],
      },
    ],
  },
];

export const getAttributesBySlug = (slug: string): AttributeField[] => {
  for (const cat of CATEGORY_CONFIG) {
    const sub = cat.subs.find((s) => s.slug === slug);
    if (sub) return sub.attributes;
  }
  return [];
};

export const getCategoryGroups = (): Record<string, string[]> => {
  return CATEGORY_CONFIG.reduce(
    (acc, cat) => {
      acc[cat.slug] = cat.subs.map((sub) => sub.slug);
      return acc;
    },
    {} as Record<string, string[]>
  );
};

/** Resolve sub-category slug → display name (for AdCard, etc.) */
export const getSubCategoryLabel = (slug: string): string | undefined => {
  for (const cat of CATEGORY_CONFIG) {
    const sub = cat.subs.find((s) => s.slug === slug);
    if (sub) return sub.name;
  }
  return undefined;
};
