// src/constants/categoryConfig.ts

export type AttributeField = {
  label: string;
  key: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'range';
  options?: string[];
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

export const CATEGORY_CONFIG: MainCategory[] = [
  {
    name: "Vehicles for Sale",
    slug: "vehicles-sale",
    subs: [
      { 
        name: "Cars", 
        slug: "vs_cars", 
        attributes: [
          { label: 'Make', key: 'make_id', type: 'select' }, 
          { label: 'Model', key: 'model_id', type: 'select' }, 
          { label: 'Year', key: 'year', type: 'range' },
          { label: 'Mileage', key: 'mileage', type: 'range' },
          { label: 'Condition', key: 'condition', type: 'select', options: ['New', 'Used'] },
          { label: 'Transmission', key: 'transmission', type: 'select', options: ['Automatic', 'Manual'] },
          { label: 'Fuel Type', key: 'fuel_type', type: 'select', options: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'] }
        ] 
      },
      // { name: "Buses", slug: "vs_buses", attributes: [{ label: 'Year', key: 'year', type: 'number' }, { label: 'Fuel Type', key: 'fuel_type', type: 'select', options: ['Diesel', 'Gasoline'] }] },
      { 
        name: "Buses", 
        slug: "vs_buses", 
        attributes: [
          { label: 'Size', key: 'size', type: 'select', options: ['Micro Bus', 'Mini Bus', 'Full-Size Bus', 'Other']}, 
          // { label: 'Model', key: 'model_id', type: 'select' }, 
          { label: 'Year', key: 'year', type: 'range' },
          { label: 'Mileage', key: 'mileage', type: 'range' },
          { label: 'Condition', key: 'condition', type: 'select', options: ['New', 'Used'] },
          { label: 'Transmission', key: 'transmission', type: 'select', options: ['Automatic', 'Manual'] },
          { label: 'Fuel Type', key: 'fuel_type', type: 'select', options: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'] }
        ] 
      },
      { name: "Trucks", slug: "vs_trucks", attributes: [{ label: 'Year', key: 'year', type: 'range' }, { label: 'Capacity (Tons)', key: 'capacity', type: 'range' }] },
      { name: "Motorcycles & Scooters", slug: "vs_motorcycles", attributes: [{ label: 'Year', key: 'year', type: 'range' }] },
      { name: "Spare Parts", slug: "vs_parts", attributes: [{ label: 'Part Type', key: 'part_type', type: 'text' }] }
    ]
  },
  {
    name: "Vehicles for Rent",
    slug: "vehicles-rent",
    subs: [
      { 
        name: "Cars", 
        slug: "vr_cars", 
        attributes: [
          { label: 'Make', key: 'make_id', type: 'select' }, 
          { label: 'Model', key: 'model_id', type: 'select' }, 
          { label: 'Year', key: 'year', type: 'range' },
          // { label: 'Condition', key: 'condition', type: 'select', options: ['New', 'Used'] },
          { label: 'Transmission', key: 'transmission', type: 'select', options: ['Automatic', 'Manual'] },
          { label: 'Fuel Type', key: 'fuel_type', type: 'select', options: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'] }
        ] 
      },
      { name: "Buses", slug: "vr_buses", attributes: [{ label: 'Year', key: 'year', type: 'range' }, { label: 'Fuel Type', key: 'fuel_type', type: 'select', options: ['Diesel', 'Gasoline'] }] },
      { name: "Trucks", slug: "vr_trucks", attributes: [{ label: 'Year', key: 'year', type: 'range' }, { label: 'Capacity (Tons)', key: 'capacity', type: 'number' }] },
      { name: "Motorcycles & Scooters", slug: "vr_motorcycles", attributes: [{ label: 'Year', key: 'year', type: 'range' }] },
      { name: "Spare Parts", slug: "vr_parts", attributes: [{ label: 'Part Type', key: 'part_type', type: 'text' }] }
    ]
  },
  {
    name: "Watercraft",
    slug: "watercraft",
    subs: [
      { name: "Power Boats & Motorboats", slug: "wc_power", attributes: [] },
      { name: "Yachts", slug: "wc_yachts", attributes: [] },
      { name: "Fishing Boats", slug: "wc_fishing", attributes: [] },
      { name: "Jet Skis & WaveRunners", slug: "wc_jetski", attributes: [] },
      { name: "Inflatables & RIBs", slug: "wc_inflatables", attributes: [] },
      { name: "Non-Motorized", slug: "wc_nonmotor", attributes: [] }
    ]
  },
  {
    name: "Properties for Sale",
    slug: "prop-sale",
    subs: [
      { name: "Residential", slug: "ps_res", attributes: [{ label: 'Bedrooms', key: 'bedrooms', type: 'range' }, { label: 'Area (sqm)', key: 'area', type: 'range' }] },
      { name: "Commercial", slug: "ps_com", attributes: [{ label: 'Area (sqm)', key: 'area', type: 'range' }] },
      { name: "Land", slug: "ps_land", attributes: [{ label: 'Area (sqm)', key: 'area', type: 'range' }] }
    ]
  },
  {
    name: "Properties for Rent",
    slug: "prop-rent",
    subs: [
      { name: "Residential", slug: "pr_res", attributes: [{ label: 'Bedrooms', key: 'bedrooms', type: 'range' }] },
      { name: "Commercial", slug: "pr_com", attributes: [] },
      { name: "Land", slug: "pr_land", attributes: [] }
    ]
  },
  {
    name: "Pets",
    slug: "pets",
    subs: [
      { name: "Dogs", slug: "pets_dogs", attributes: [{ label: 'Breed', key: 'breed', type: 'text' }] },
      { name: "Cats", slug: "pets_cats", attributes: [] },
      { name: "Birds", slug: "pets_birds", attributes: [] },
      { name: "Fish", slug: "pets_fish", attributes: [] },
      { name: "Reptiles", slug: "pets_reptiles", attributes: [] },
      { name: "Small Animals", slug: "pets_small", attributes: [] }
    ]
  },
  {
    name: "Electronics",
    slug: "electronics",
    subs: [
      { name: "Mobiles & Tablets", slug: "elec_mobile", attributes: [{ label: 'Brand', key: 'brand', type: 'text' }, { label: 'Storage', key: 'storage', type: 'select', options: ['64GB', '128GB', '256GB', '512GB'] }] },
      { name: "Laptops & Computers", slug: "elec_laptop", attributes: [{ label: 'RAM', key: 'ram', type: 'select', options: ['8GB', '16GB', '32GB'] }] },
      { name: "Home Appliances", slug: "elec_home", attributes: [] },
      { name: "Electronics", slug: "elec_general", attributes: [] }
    ]
  },
  {
    name: "Fashion",
    slug: "fashion",
    subs: [
      { name: "Clothing", slug: "fash_cloth", attributes: [{ label: 'Size', key: 'size', type: 'select', options: ['S', 'M', 'L', 'XL'] }] },
      { name: "Accessories", slug: "fash_acc", attributes: [] }
    ]
  },
  {
    name: "Business",
    slug: "business",
    subs: [
      { name: "Job Opening", slug: "bus_opening", attributes: [] },
      { name: "Job Seeker", slug: "bus_seeker", attributes: [] }
    ]
  },
  {
    name: "Education & Courses",
    slug: "education",
    subs: [
      { 
        name: "Languages",
        slug: "lang", 
        attributes: [
          { label: 'Language', key: 'language', type: 'select', options: [
            'Arabic','Bengali', 'Chinese', 'English', 'French','Hindi','Italian','Japanese','Korean','Portuguese','Russian','Spanish','Other'
          ] },
          { label: 'Method', key: 'method', type: 'select', options: [
            'Online','Inperson', 'Both'
          ] }
        ] 
      },

      { name: "Educational Subjects",
        slug: "edu_subject",
        attributes: [
          { label: 'Subjects', key: 'subject', type: 'select', options: [
            'Biology','Chemistry', 'Geography', 'History', 'Mathematics','Physics','Other'
          ] },
          { label: 'Level', key: 'level', type: 'select', options: [
            'Primary','Elmentary', 'Secondary'
          ] },
          { label: 'Method', key: 'method', type: 'select', options: [
            'Online','Inperson', 'Both'
          ] }
        ] },
      { name: "Musical Instruments",
        slug: "music",
        attributes: [
        { label: 'Instruments', key: 'instrument', type: 'select', options: [
          'Accordion', 'Cello', 'Clarinet', 'Drums', 'Flute', 'Guitar', 'Organ', 'Piano', 'Saxophone',
          'Trumpet', 'Violin', 'Vocal / Singing', 'Xylophone', 'Other'
        ] }
      ] },
      // { name: "Skils", slug: "bus_seeker", attributes: [] }
    ]
  }
];

export const getAttributesBySlug = (slug: string): AttributeField[] => {
  for (const cat of CATEGORY_CONFIG) {
    const sub = cat.subs.find(s => s.slug === slug);
    if (sub) return sub.attributes;
  }
  return [];
};

export const getCategoryGroups = (): Record<string, string[]> => {
  return CATEGORY_CONFIG.reduce((acc, cat) => {
    acc[cat.slug] = cat.subs.map(sub => sub.slug);
    return acc;
  }, {} as Record<string, string[]>);
};