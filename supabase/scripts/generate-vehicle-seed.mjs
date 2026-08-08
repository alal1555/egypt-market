/**
 * Generates supabase/seed-vehicles.sql from curated Egypt-market vehicle data.
 * Run: node supabase/scripts/generate-vehicle-seed.mjs
 */

import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, string[]>} */
const VEHICLES = {
  Toyota: [
    "Corolla", "Camry", "Yaris", "Fortuner", "Hilux", "Land Cruiser", "RAV4",
    "Highlander", "Prius", "Avanza", "Rush", "C-HR", "Supra", "GR86", "Avalon",
    "Sequoia", "Tundra", "Tacoma", "4Runner", "Sienna", "Innova", "bZ4X",
    "Corolla Cross", "Urban Cruiser", "FJ Cruiser", "Crown", "Venza", "Matrix",
    "Celica", "MR2", "Other",
  ],
  Nissan: [
    "Sunny", "Sentra", "Altima", "Maxima", "Micra", "Qashqai", "X-Trail",
    "Patrol", "Kicks", "Juke", "Navara", "Pathfinder", "Murano", "Armada",
    "Tiida", "Leaf", "Ariya", "370Z", "GT-R", "Terrano", "X-Terra", "Teana",
    "Primera", "Pulsar", "Cedric", "Other",
  ],
  Hyundai: [
    "Elantra", "Accent", "Sonata", "Tucson", "Creta", "Santa Fe", "Palisade",
    "Kona", "i10", "i20", "i30", "Azera", "Grand i10", "Verna", "H-1", "Staria",
    "Ioniq", "Ioniq 5", "Ioniq 6", "Venue", "Bayon", "Coupe", "Genesis Coupe",
    "Atos", "Matrix", "Getz", "Trajet", "Other",
  ],
  Kia: [
    "Cerato", "Optima", "K5", "Rio", "Picanto", "Sportage", "Sorento", "Carnival",
    "Soul", "Stinger", "Telluride", "Seltos", "Niro", "EV6", "Pegas", "Cadenza",
    "Mohave", "Carens", "Other",
  ],
  Chevrolet: [
    "Optra", "Lanos", "Aveo", "Cruze", "Malibu", "Spark", "Captiva", "Trax",
    "Equinox", "Tahoe", "Suburban", "Silverado", "Camaro", "Corvette", "Blazer",
    "Traverse", "Impala", "Trailblazer", "Colorado", "Bolt", "Nubira", "Epica",
    "Alero", "Other",
  ],
  Mercedes: [
    "A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA",
    "GLB", "GLC", "GLE", "GLS", "G-Class", "AMG GT", "V-Class", "Sprinter",
    "Maybach S-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "SL", "SLC", "Other",
  ],
  BMW: [
    "1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series",
    "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4",
    "i3", "i4", "iX", "iX3", "M2", "M3", "M4", "M5", "Other",
  ],
  Volkswagen: [
    "Golf", "Polo", "Passat", "Jetta", "Tiguan", "Touareg", "Teramont", "T-Roc",
    "Arteon", "Beetle", "Scirocco", "ID.3", "ID.4", "ID.6", "Amarok", "Caddy",
    "Transporter", "Other",
  ],
  Audi: [
    "A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8",
    "TT", "R8", "e-tron", "e-tron GT", "RS3", "RS5", "RS6", "RS7", "S3", "S4", "Other",
  ],
  Ford: [
    "Focus", "Fiesta", "Fusion", "Mondeo", "Mustang", "Explorer", "Expedition",
    "Escape", "Edge", "Bronco", "Ranger", "F-150", "EcoSport", "Territory",
    "Everest", "Transit", "Other",
  ],
  Honda: [
    "City", "Civic", "Accord", "CR-V", "HR-V", "Pilot", "Odyssey", "Jazz",
    "Fit", "BR-V", "ZR-V", "e:Ny1", "Other",
  ],
  Mitsubishi: [
    "Lancer", "Attrage", "Mirage", "ASX", "Outlander", "Pajero", "Montero",
    "Eclipse Cross", "Xpander", "L200", "Other",
  ],
  Mazda: [
    "Mazda 2", "Mazda 3", "Mazda 6", "CX-3", "CX-30", "CX-5", "CX-9", "CX-60",
    "CX-90", "MX-5", "BT-50", "Other",
  ],
  Suzuki: [
    "Swift", "Celerio", "Baleno", "Dzire", "Vitara", "Grand Vitara", "Jimny",
    "Ertiga", "Ciaz", "Alto", "Other",
  ],
  Lexus: [
    "IS", "ES", "GS", "LS", "RC", "LC", "UX", "NX", "RX", "GX", "LX", "Other",
  ],
  Subaru: [
    "Impreza", "Legacy", "WRX", "BRZ", "Forester", "Outback", "Crosstrek",
    "Ascent", "XV", "Other",
  ],
  Renault: [
    "Symbol", "Logan", "Sandero", "Megane", "Fluence", "Duster", "Koleos",
    "Captur", "Kadjar", "Scenic", "Clio", "Talisman", "Laguna", "Safrane",
    "Kangoo", "Twingo", "Other",
  ],
  Peugeot: [
    "206", "207", "301", "308", "408", "508", "2008", "3008", "5008", "Partner",
    "Expert", "Boxer", "405", "406", "607", "RCZ", "Other",
  ],
  Fiat: [
    "500", "Panda", "Tipo", "Linea", "Punto", "500X", "Doblo", "Other",
  ],
  Skoda: [
    "Fabia", "Octavia", "Superb", "Rapid", "Kamiq", "Karoq", "Kodiaq", "Scala",
    "Enyaq", "Other",
  ],
  Volvo: [
    "S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40", "Other",
  ],
  Jeep: [
    "Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator",
    "Commander", "Other",
  ],
  Dodge: [
    "Charger", "Challenger", "Durango", "Ram 1500", "Journey", "Neon", "Other",
  ],
  Chrysler: [
    "300C", "Pacifica", "Voyager", "Sebring", "Other",
  ],
  Cadillac: [
    "Escalade", "XT4", "XT5", "XT6", "CT4", "CT5", "CT6", "Other",
  ],
  GMC: [
    "Yukon", "Sierra", "Terrain", "Acadia", "Canyon", "Other",
  ],
  Porsche: [
    "911", "Cayenne", "Macan", "Panamera", "Taycan", "Boxster", "Cayman", "Other",
  ],
  BYD: [
    "F0", "F3", "F6", "S6", "S7", "Han", "Tang", "Song", "Song Plus", "Atto 3",
    "Seal", "Dolphin", "Yuan Plus", "Qin", "Other",
  ],
  Chery: [
    "QQ", "Tiggo 2", "Tiggo 3", "Tiggo 4", "Tiggo 5", "Tiggo 7", "Tiggo 8",
    "Arrizo 5", "Arrizo 6", "Arrizo 8", "Other",
  ],
  Geely: [
    "Emgrand", "Coolray", "Azkarra", "Okavango", "Monjaro", "Geometry C",
    "GC6", "CK", "Other",
  ],
  MG: [
    "MG 3", "MG 5", "MG 6", "MG ZS", "MG HS", "MG RX5", "MG RX8", "MG 4",
    "MG GT", "Other",
  ],
  Haval: [
    "H2", "H6", "H9", "Jolion", "Dargo", "Other",
  ],
  Changan: [
    "Alsvin", "Eado", "CS35", "CS55", "CS75", "CS95", "Other",
  ],
  JAC: [
    "S2", "S3", "S4", "S5", "S7", "J7", "Other",
  ],
  FAW: [
    "Bestune T77", "Bestune T99", "Other",
  ],
  Isuzu: [
    "D-Max", "MU-X", "Other",
  ],
  Opel: [
    "Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland", "Zafira",
    "Vectra", "Meriva", "Adam", "Combo", "Omega", "Tigra", "Antara", "Agila",
    "Kadett", "Other",
  ],
  Citroën: [
    "C3", "C4", "C5", "C-Elysee", "Berlingo", "C3 Aircross", "C5 Aircross",
    "DS3", "Xsara", "C4 Picasso", "C8", "Saxo", "Other",
  ],
  "Land Rover": [
    "Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport",
    "Range Rover Evoque", "Range Rover Velar", "Freelander", "Other",
  ],
  Mini: [
    "Cooper", "Cooper S", "Countryman", "Clubman", "Paceman", "Other",
  ],
  Tesla: [
    "Model 3", "Model Y", "Model S", "Model X", "Cybertruck", "Other",
  ],
  GWM: [
    "Haval H6", "Tank 300", "Tank 500", "Wingle", "Poer", "Other",
  ],
  Seat: [
    "Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Toledo", "Other",
  ],
  Jetour: [
    "X70", "X90", "Dashing", "T2", "Other",
  ],
  Exeed: [
    "TXL", "VX", "LX", "Other",
  ],
  Infiniti: [
    "Q30", "Q50", "Q60", "QX50", "QX55", "QX60", "QX80", "Other",
  ],
  SsangYong: [
    "Tivoli", "Korando", "Rexton", "Musso", "Other",
  ],
  Daewoo: [
    "Lanos", "Nubira", "Matiz", "Leganza", "Other",
  ],
  "Alfa Romeo": [
    "Giulia", "Stelvio", "Giulietta", "MiTo", "Other",
  ],
  DS: [
    "DS 3", "DS 4", "DS 7", "DS 9", "Other",
  ],
  BAIC: [
    "X25", "X35", "X55", "BJ40", "Other",
  ],
  Dongfeng: [
    "Shine Max", "Huge", "Other",
  ],
  Proton: [
    "Saga", "Persona", "X50", "X70", "Other",
  ],
  Mahindra: [
    "Scorpio", "XUV500", "XUV700", "Thar", "Other",
  ],
  Lada: [
    "Niva", "Granta", "Vesta", "Other",
  ],
  Genesis: [
    "G70", "G80", "G90", "GV60", "GV70", "GV80", "Other",
  ],
  Ram: [
    "1500", "2500", "3500", "Other",
  ],
  Lincoln: [
    "Navigator", "Aviator", "Corsair", "Nautilus", "Other",
  ],
};

const makes = Object.keys(VEHICLES).sort((a, b) => a.localeCompare(b));
const modelRows = [];

for (const make of makes) {
  const models = VEHICLES[make];
  if (!models.includes("Other")) models.push("Other");
  for (const model of models) {
    modelRows.push([make, model]);
  }
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

const makeValues = makes.map((m) => `  ('${sqlEscape(m)}')`).join(",\n");

const modelValues = modelRows
  .map(([make, model]) => `  ('${sqlEscape(make)}', '${sqlEscape(model)}')`)
  .join(",\n");

const sql = `-- Yaddii Marketplace — vehicle makes & models seed
-- Curated for Egypt classifieds (~${makes.length} makes, ~${modelRows.length} models)
-- Safe to re-run: skips existing makes and models.
--
-- Run in Supabase SQL Editor AFTER schema.sql
-- Regenerate: node supabase/scripts/generate-vehicle-seed.mjs

-- ---------------------------------------------------------------------------
-- Makes
-- ---------------------------------------------------------------------------
insert into public.makes (name)
values
${makeValues}
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Models (linked by make name)
-- ---------------------------------------------------------------------------
with model_data (make_name, model_name) as (
  values
${modelValues}
)
insert into public.models (name, make_id)
select md.model_name, m.id
from model_data md
join public.makes m on m.name = md.make_name
where not exists (
  select 1
  from public.models mo
  where mo.make_id = m.id
    and mo.name = md.model_name
);

-- Optional: prevent duplicate models on future manual inserts
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'models_make_id_name_key'
      and conrelid = 'public.models'::regclass
  ) then
    alter table public.models
      add constraint models_make_id_name_key unique (make_id, name);
  end if;
end $$;

-- Summary
select
  (select count(*) from public.makes) as makes,
  (select count(*) from public.models) as models;
`;

const outPath = join(__dirname, "..", "seed-vehicles.sql");
writeFileSync(outPath, sql, "utf8");

console.log(`Wrote ${outPath}`);
console.log(`  Makes: ${makes.length}`);
console.log(`  Models: ${modelRows.length}`);
