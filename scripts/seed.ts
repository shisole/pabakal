import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

// ─── Load .env.local ───────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const value = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local not found — rely on process.env
  }
}

loadEnv();

// ─── Config ────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ───────────────────────────────────────────────────
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ─── Seed Emails (for cleanup) ─────────────────────────────────
const ADMIN_EMAILS = ["admin@pabakal.com", "aunt@pabakal.com"];
const CUSTOMER_EMAILS = [
  "customer1@example.com",
  "customer2@example.com",
  "customer3@example.com",
  "customer4@example.com",
  "customer5@example.com",
];
const ALL_SEED_EMAILS = [...ADMIN_EMAILS, ...CUSTOMER_EMAILS];

// ─── Cleanup ───────────────────────────────────────────────────
async function cleanup() {
  console.log("Cleaning up existing seed data...");

  // Find existing auth users by email
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const seedUsers = authUsers?.users?.filter((u) => ALL_SEED_EMAILS.includes(u.email ?? "")) ?? [];

  if (seedUsers.length > 0) {
    const seedUserIds = seedUsers.map((u) => u.id);

    // Delete in reverse dependency order
    // Notifications, reviews, payments, order_items, orders depend on profiles
    // Products, cargos, exchange_rates depend on profiles
    await supabase.from("notifications").delete().in("user_id", seedUserIds);
    await supabase.from("reviews").delete().in("customer_id", seedUserIds);

    // Get orders for these customers
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .in("customer_id", seedUserIds);
    const orderIds = orders?.map((o) => o.id) ?? [];

    if (orderIds.length > 0) {
      await supabase.from("payments").delete().in("order_id", orderIds);
      await supabase.from("order_items").delete().in("order_id", orderIds);
      await supabase.from("orders").delete().in("id", orderIds);
    }

    // Delete products added by seed admins
    const { data: products } = await supabase
      .from("products")
      .select("id")
      .in("added_by", seedUserIds);
    const productIds = products?.map((p) => p.id) ?? [];

    if (productIds.length > 0) {
      await supabase.from("product_images").delete().in("product_id", productIds);
      await supabase.from("product_variants").delete().in("product_id", productIds);
      await supabase.from("products").delete().in("id", productIds);
    }

    // Delete cargos (cascade handles status history)
    await supabase.from("cargo_status_history").delete().in("changed_by", seedUserIds);
    await supabase.from("cargos").delete().in("created_by", seedUserIds);

    // Delete exchange rates
    await supabase.from("exchange_rates").delete().in("set_by", seedUserIds);

    // Delete auth users (cascade deletes profiles)
    for (const user of seedUsers) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  console.log("  Cleanup complete.");
}

// ─── Seed Users ────────────────────────────────────────────────
interface SeedUser {
  id: string;
  email: string;
}

async function seedUsers(): Promise<{ admins: SeedUser[]; customers: SeedUser[] }> {
  console.log("Seeding users...");

  const admins: SeedUser[] = [];
  const customers: SeedUser[] = [];

  // Admin 1 — PH user
  const { data: admin1 } = await supabase.auth.admin.createUser({
    email: "admin@pabakal.com",
    password: "password123",
    email_confirm: true,
    user_metadata: { full_name: "Stephen Hisole" },
  });
  if (!admin1.user) throw new Error("Failed to create admin1");
  admins.push({ id: admin1.user.id, email: "admin@pabakal.com" });

  // Admin 2 — US aunt
  const { data: admin2 } = await supabase.auth.admin.createUser({
    email: "aunt@pabakal.com",
    password: "password123",
    email_confirm: true,
    user_metadata: { full_name: "Tita Beth" },
  });
  if (!admin2.user) throw new Error("Failed to create admin2");
  admins.push({ id: admin2.user.id, email: "aunt@pabakal.com" });

  // Update admin profiles
  await supabase
    .from("profiles")
    .update({
      role: "admin",
      full_name: "Stephen Hisole",
      phone: "+639171234567",
      address_line: "123 Rizal St, Brgy. San Jose",
      city: "Iloilo City",
      province: "Iloilo",
      zip_code: "5000",
    })
    .eq("id", admin1.user.id);

  await supabase
    .from("profiles")
    .update({
      role: "admin",
      full_name: "Tita Beth",
      phone: "+16501234567",
      address_line: "456 Oak Avenue",
      city: "Daly City",
      province: "California",
      zip_code: "94014",
    })
    .eq("id", admin2.user.id);

  // Customers
  const customerData = [
    {
      email: "customer1@example.com",
      full_name: "Maria Santos",
      phone: "+639181234567",
      address_line: "78 Mabini St, Brgy. Centro",
      city: "Iloilo City",
      province: "Iloilo",
      zip_code: "5000",
    },
    {
      email: "customer2@example.com",
      full_name: "Juan dela Cruz",
      phone: "+639191234567",
      address_line: "15 Colon St, Brgy. Parian",
      city: "Cebu City",
      province: "Cebu",
      zip_code: "6000",
    },
    {
      email: "customer3@example.com",
      full_name: "Ana Reyes",
      phone: "+639201234567",
      address_line: "234 EDSA, Brgy. Highway Hills",
      city: "Mandaluyong City",
      province: "Metro Manila",
      zip_code: "1550",
    },
    {
      email: "customer4@example.com",
      full_name: "Carlo Mendoza",
      phone: "+639211234567",
      address_line: "56 Quirino Ave, Brgy. Poblacion",
      city: "Davao City",
      province: "Davao del Sur",
      zip_code: "8000",
    },
    {
      email: "customer5@example.com",
      full_name: "Jasmine Villanueva",
      phone: "+639221234567",
      address_line: "89 Session Rd, Brgy. Central",
      city: "Baguio City",
      province: "Benguet",
      zip_code: "2600",
    },
  ];

  for (const c of customerData) {
    const { data } = await supabase.auth.admin.createUser({
      email: c.email,
      password: "password123",
      email_confirm: true,
      user_metadata: { full_name: c.full_name },
    });
    if (!data.user) throw new Error(`Failed to create ${c.email}`);
    customers.push({ id: data.user.id, email: c.email });

    await supabase
      .from("profiles")
      .update({
        full_name: c.full_name,
        phone: c.phone,
        address_line: c.address_line,
        city: c.city,
        province: c.province,
        zip_code: c.zip_code,
      })
      .eq("id", data.user.id);
  }

  console.log(`  Created ${admins.length} admins, ${customers.length} customers.`);
  return { admins, customers };
}

// ─── Seed Exchange Rate ────────────────────────────────────────
async function seedExchangeRate(adminId: string) {
  console.log("Seeding exchange rate...");

  await supabase.from("exchange_rates").insert({
    rate: 56.5,
    effective_date: today(),
    set_by: adminId,
  });

  console.log("  Exchange rate set: 1 USD = 56.50 PHP");
}

// ─── Seed Cargos ───────────────────────────────────────────────
interface SeedCargo {
  id: string;
  name: string;
  status: string;
}

async function seedCargos(adminId: string): Promise<SeedCargo[]> {
  console.log("Seeding cargos...");

  const cargoData = [
    {
      name: "Box #2025-12 (Holiday Haul)",
      status: "arrived" as const,
      shipping_provider: "LBC Hari ng Padala",
      tracking_number: "LBC-2025-00412",
      total_shipping_cost_php: 4500,
      estimated_arrival: "2025-12-20",
      actual_arrival: "2025-12-18",
      notes: "Holiday shipment - arrived early!",
    },
    {
      name: "Box #2026-01 (New Year Restock)",
      status: "in_transit" as const,
      shipping_provider: "ForEx Cargo",
      tracking_number: "FXC-2026-00087",
      total_shipping_cost_php: 5200,
      estimated_arrival: daysFromNow(14),
      actual_arrival: null,
      notes: "Mid-January restock, mostly electronics and beauty items",
    },
    {
      name: "Box #2026-02 (February Batch)",
      status: "purchased" as const,
      shipping_provider: "Johnny Air Cargo",
      tracking_number: null,
      total_shipping_cost_php: 0,
      estimated_arrival: null,
      actual_arrival: null,
      notes: "Just started buying items for this box",
    },
  ];

  const cargos: SeedCargo[] = [];

  for (const c of cargoData) {
    const { data, error } = await supabase
      .from("cargos")
      .insert({ ...c, created_by: adminId })
      .select("id, name, status")
      .single();
    if (error) throw new Error(`Failed to create cargo: ${error.message}`);
    cargos.push(data);
  }

  // Status history for Box 1 (arrived)
  const statusFlow1 = [
    { status: "purchased" as const, notes: "Started buying items", daysAgoVal: 60 },
    { status: "packed" as const, notes: "All items packed", daysAgoVal: 45 },
    { status: "shipped" as const, notes: "Dropped off at LBC warehouse", daysAgoVal: 40 },
    { status: "in_transit" as const, notes: "On the ship to PH", daysAgoVal: 30 },
    { status: "arrived" as const, notes: "Received at Iloilo!", daysAgoVal: 5 },
  ];

  for (const s of statusFlow1) {
    await supabase.from("cargo_status_history").insert({
      cargo_id: cargos[0].id,
      status: s.status,
      changed_by: adminId,
      notes: s.notes,
      created_at: daysAgo(s.daysAgoVal),
    });
  }

  // Status history for Box 2 (in_transit)
  const statusFlow2 = [
    { status: "purchased" as const, notes: "Buying restock items", daysAgoVal: 25 },
    { status: "packed" as const, notes: "Box packed and sealed", daysAgoVal: 15 },
    { status: "shipped" as const, notes: "Shipped via ForEx Cargo", daysAgoVal: 10 },
    { status: "in_transit" as const, notes: "Currently on its way", daysAgoVal: 7 },
  ];

  for (const s of statusFlow2) {
    await supabase.from("cargo_status_history").insert({
      cargo_id: cargos[1].id,
      status: s.status,
      changed_by: adminId,
      notes: s.notes,
      created_at: daysAgo(s.daysAgoVal),
    });
  }

  // Status history for Box 3 (purchased)
  await supabase.from("cargo_status_history").insert({
    cargo_id: cargos[2].id,
    status: "purchased",
    changed_by: adminId,
    notes: "Starting February batch",
    created_at: daysAgo(2),
  });

  console.log(`  Created ${cargos.length} cargos with status histories.`);
  return cargos;
}

// ─── Product Data ──────────────────────────────────────────────
interface ProductSeed {
  name: string;
  brand: string;
  description: string;
  cost_usd: number;
  tags: string[];
  condition: "new" | "like_new" | "good" | "fair";
}

const PRODUCTS_BY_CATEGORY: Record<string, ProductSeed[]> = {
  electronics: [
    {
      name: "Apple AirPods Pro 2nd Gen",
      brand: "Apple",
      description: "Active noise cancelling earbuds with USB-C charging case",
      cost_usd: 189,
      tags: ["audio", "wireless", "apple"],
      condition: "new",
    },
    {
      name: "Anker 65W USB-C Charger",
      brand: "Anker",
      description: "Compact GaN charger with 3 ports for phones and laptops",
      cost_usd: 35,
      tags: ["charger", "usb-c", "fast-charge"],
      condition: "new",
    },
    {
      name: "Logitech MX Master 3S Mouse",
      brand: "Logitech",
      description: "Ergonomic wireless mouse with quiet clicks and MagSpeed scroll",
      cost_usd: 89,
      tags: ["mouse", "wireless", "ergonomic"],
      condition: "new",
    },
    {
      name: "Samsung T7 1TB Portable SSD",
      brand: "Samsung",
      description: "Fast external SSD with USB 3.2 transfer speeds up to 1050MB/s",
      cost_usd: 79,
      tags: ["storage", "ssd", "portable"],
      condition: "new",
    },
    {
      name: "JBL Flip 6 Bluetooth Speaker",
      brand: "JBL",
      description: "Portable waterproof speaker with bold sound and 12-hour playtime",
      cost_usd: 99,
      tags: ["speaker", "bluetooth", "waterproof"],
      condition: "new",
    },
    {
      name: "Apple Watch SE 2nd Gen 40mm",
      brand: "Apple",
      description: "Smart fitness tracker with heart rate, GPS, and crash detection",
      cost_usd: 199,
      tags: ["smartwatch", "fitness", "apple"],
      condition: "new",
    },
    {
      name: "Fire TV Stick 4K Max",
      brand: "Amazon",
      description: "Streaming device with Wi-Fi 6E and Alexa voice remote",
      cost_usd: 39,
      tags: ["streaming", "tv", "alexa"],
      condition: "new",
    },
    {
      name: "Baseus 20000mAh Power Bank",
      brand: "Baseus",
      description: "High capacity power bank with 65W fast charging",
      cost_usd: 45,
      tags: ["powerbank", "portable", "fast-charge"],
      condition: "new",
    },
    {
      name: "Sony WH-1000XM5 Headphones",
      brand: "Sony",
      description: "Premium noise cancelling over-ear headphones with 30hr battery",
      cost_usd: 298,
      tags: ["headphones", "noise-cancelling", "sony"],
      condition: "new",
    },
    {
      name: "Kindle Paperwhite 11th Gen",
      brand: "Amazon",
      description: "6.8 inch e-reader with adjustable warm light and 16GB storage",
      cost_usd: 139,
      tags: ["ereader", "kindle", "books"],
      condition: "new",
    },
    {
      name: "Apple Lightning to USB-C Cable",
      brand: "Apple",
      description: "Original Apple MFi certified charging cable 1m",
      cost_usd: 15,
      tags: ["cable", "apple", "charging"],
      condition: "new",
    },
    {
      name: "Razer DeathAdder V3 Mouse",
      brand: "Razer",
      description: "Ultra-lightweight ergonomic gaming mouse with Focus Pro sensor",
      cost_usd: 69,
      tags: ["gaming", "mouse", "razer"],
      condition: "new",
    },
    {
      name: "Google Chromecast HD",
      brand: "Google",
      description: "Stream your favorite entertainment to your TV in HD",
      cost_usd: 29,
      tags: ["streaming", "chromecast", "google"],
      condition: "new",
    },
  ],
  "beauty-skincare": [
    {
      name: "CeraVe Moisturizing Cream 16oz",
      brand: "CeraVe",
      description: "Daily face and body moisturizer with ceramides and hyaluronic acid",
      cost_usd: 16,
      tags: ["moisturizer", "ceramides", "sensitive-skin"],
      condition: "new",
    },
    {
      name: "The Ordinary Niacinamide 10% + Zinc 1%",
      brand: "The Ordinary",
      description: "High-strength vitamin and mineral serum for blemishes and pores",
      cost_usd: 6,
      tags: ["serum", "niacinamide", "acne"],
      condition: "new",
    },
    {
      name: "Neutrogena Ultra Sheer SPF 50+",
      brand: "Neutrogena",
      description: "Lightweight dry-touch sunscreen that's non-greasy and fast absorbing",
      cost_usd: 11,
      tags: ["sunscreen", "spf50", "lightweight"],
      condition: "new",
    },
    {
      name: "Maybelline Lash Sensational Mascara",
      brand: "Maybelline",
      description: "Full fan effect mascara with rose oil for voluminous lashes",
      cost_usd: 9,
      tags: ["mascara", "makeup", "volumizing"],
      condition: "new",
    },
    {
      name: "Paula's Choice 2% BHA Exfoliant",
      brand: "Paula's Choice",
      description: "Leave-on exfoliant for unclogging pores and smoothing wrinkles",
      cost_usd: 32,
      tags: ["exfoliant", "bha", "pores"],
      condition: "new",
    },
    {
      name: "NYX Professional Lip Liner",
      brand: "NYX",
      description: "Creamy and smooth lip liner pencil in shade Nude Beige",
      cost_usd: 5,
      tags: ["lip-liner", "makeup", "nude"],
      condition: "new",
    },
    {
      name: "Dove Body Wash Deep Moisture 22oz",
      brand: "Dove",
      description: "Nourishing body wash with NutriumMoisture technology",
      cost_usd: 8,
      tags: ["body-wash", "moisturizing", "dove"],
      condition: "new",
    },
    {
      name: "ELF Camo CC Cream SPF 30",
      brand: "e.l.f.",
      description: "Color-correcting cream with SPF 30 for natural coverage",
      cost_usd: 14,
      tags: ["cc-cream", "spf", "makeup"],
      condition: "new",
    },
    {
      name: "Olaplex No.3 Hair Perfector",
      brand: "Olaplex",
      description: "At-home treatment to reduce breakage and strengthen hair",
      cost_usd: 28,
      tags: ["hair-treatment", "repair", "olaplex"],
      condition: "new",
    },
    {
      name: "La Roche-Posay Effaclar Duo+",
      brand: "La Roche-Posay",
      description: "Dual action acne treatment with niacinamide and salicylic acid",
      cost_usd: 29,
      tags: ["acne", "treatment", "niacinamide"],
      condition: "new",
    },
    {
      name: "Bath & Body Works Mist - Japanese Cherry Blossom",
      brand: "Bath & Body Works",
      description: "Fine fragrance mist with cherry blossom, mimosa, and sandalwood",
      cost_usd: 16,
      tags: ["fragrance", "mist", "floral"],
      condition: "new",
    },
    {
      name: "Real Techniques Sponge Set",
      brand: "Real Techniques",
      description: "Miracle complexion sponge duo for foundation and concealer",
      cost_usd: 10,
      tags: ["sponge", "makeup-tools", "blending"],
      condition: "new",
    },
    {
      name: "Cetaphil Gentle Skin Cleanser 16oz",
      brand: "Cetaphil",
      description: "Mild formula face wash for all skin types including sensitive",
      cost_usd: 12,
      tags: ["cleanser", "gentle", "sensitive-skin"],
      condition: "new",
    },
  ],
  fashion: [
    {
      name: "Nike Air Force 1 '07 White",
      brand: "Nike",
      description: "Classic all-white leather sneakers, men's size 10",
      cost_usd: 110,
      tags: ["sneakers", "nike", "classic"],
      condition: "new",
    },
    {
      name: "Levi's 501 Original Fit Jeans",
      brand: "Levi's",
      description: "The original straight fit jean with button fly, medium wash",
      cost_usd: 59,
      tags: ["jeans", "denim", "classic"],
      condition: "new",
    },
    {
      name: "Champion Reverse Weave Hoodie",
      brand: "Champion",
      description: "Heavyweight fleece hoodie in Oxford Grey, unisex fit",
      cost_usd: 55,
      tags: ["hoodie", "streetwear", "fleece"],
      condition: "new",
    },
    {
      name: "Adidas Ultraboost Light Running Shoes",
      brand: "Adidas",
      description: "Lightweight running shoes with BOOST midsole cushioning",
      cost_usd: 140,
      tags: ["running", "adidas", "boost"],
      condition: "new",
    },
    {
      name: "Herschel Classic Backpack XL",
      brand: "Herschel",
      description: "30L everyday backpack with padded laptop sleeve",
      cost_usd: 65,
      tags: ["backpack", "everyday", "laptop"],
      condition: "new",
    },
    {
      name: "Ray-Ban Wayfarer Classic Sunglasses",
      brand: "Ray-Ban",
      description: "Iconic sunglasses with polarized green G-15 lenses",
      cost_usd: 145,
      tags: ["sunglasses", "polarized", "classic"],
      condition: "new",
    },
    {
      name: "Uniqlo Heattech Ultra Warm Crew Neck",
      brand: "Uniqlo",
      description: "Thermal base layer for extreme cold, slim fit",
      cost_usd: 19,
      tags: ["thermal", "base-layer", "winter"],
      condition: "new",
    },
    {
      name: "Calvin Klein Cotton Stretch Trunks 3-Pack",
      brand: "Calvin Klein",
      description: "Classic stretch cotton trunks with signature waistband",
      cost_usd: 39,
      tags: ["underwear", "cotton", "basics"],
      condition: "new",
    },
    {
      name: "Converse Chuck Taylor All Star High",
      brand: "Converse",
      description: "Classic high-top canvas sneakers in black",
      cost_usd: 60,
      tags: ["sneakers", "canvas", "high-top"],
      condition: "new",
    },
    {
      name: "Fjallraven Kanken Backpack",
      brand: "Fjallraven",
      description: "Iconic Swedish backpack in Navy, water-resistant Vinylon F fabric",
      cost_usd: 80,
      tags: ["backpack", "swedish", "water-resistant"],
      condition: "new",
    },
    {
      name: "Tommy Hilfiger Slim Fit Polo",
      brand: "Tommy Hilfiger",
      description: "Classic fit cotton polo shirt with flag logo",
      cost_usd: 49,
      tags: ["polo", "cotton", "classic"],
      condition: "new",
    },
    {
      name: "Casio G-Shock GA-2100",
      brand: "Casio",
      description: "Carbon core guard octagonal bezel watch, matte black",
      cost_usd: 99,
      tags: ["watch", "g-shock", "casual"],
      condition: "new",
    },
    {
      name: "New Balance 574 Classic",
      brand: "New Balance",
      description: "Retro lifestyle sneakers with ENCAP midsole cushioning",
      cost_usd: 84,
      tags: ["sneakers", "retro", "lifestyle"],
      condition: "new",
    },
  ],
  "health-supplements": [
    {
      name: "Nature Made Vitamin D3 2000 IU",
      brand: "Nature Made",
      description: "Softgels for bone and immune support, 250 count",
      cost_usd: 12,
      tags: ["vitamin-d", "immune", "bone-health"],
      condition: "new",
    },
    {
      name: "Centrum Silver Adults 50+ Multivitamin",
      brand: "Centrum",
      description: "Complete multivitamin for adults 50+, 200 tablets",
      cost_usd: 18,
      tags: ["multivitamin", "seniors", "daily"],
      condition: "new",
    },
    {
      name: "Optimum Nutrition Gold Standard Whey 5lb",
      brand: "Optimum Nutrition",
      description: "Double rich chocolate whey protein powder, 73 servings",
      cost_usd: 62,
      tags: ["protein", "whey", "fitness"],
      condition: "new",
    },
    {
      name: "Kirkland Omega-3 Fish Oil 1000mg",
      brand: "Kirkland",
      description: "Heart health omega-3 softgels with EPA/DHA, 400 count",
      cost_usd: 14,
      tags: ["fish-oil", "omega-3", "heart"],
      condition: "new",
    },
    {
      name: "Garden of Life Probiotics 50 Billion",
      brand: "Garden of Life",
      description: "Once daily probiotic for digestive and immune health",
      cost_usd: 35,
      tags: ["probiotics", "gut-health", "immune"],
      condition: "new",
    },
    {
      name: "Advil Ibuprofen 200mg 300ct",
      brand: "Advil",
      description: "Pain reliever and fever reducer coated tablets",
      cost_usd: 16,
      tags: ["pain-relief", "ibuprofen", "otc"],
      condition: "new",
    },
    {
      name: "Biotin 10000mcg Gummies",
      brand: "Nature's Bounty",
      description: "Hair, skin and nails supplement with biotin, 140 gummies",
      cost_usd: 10,
      tags: ["biotin", "hair", "nails"],
      condition: "new",
    },
    {
      name: "Emergen-C 1000mg Vitamin C Packets",
      brand: "Emergen-C",
      description: "Super orange vitamin C drink mix, 30 packets",
      cost_usd: 11,
      tags: ["vitamin-c", "immune", "drink-mix"],
      condition: "new",
    },
    {
      name: "Melatonin 5mg Sleep Gummies",
      brand: "Natrol",
      description: "Drug-free sleep aid with melatonin, strawberry flavor, 90ct",
      cost_usd: 9,
      tags: ["melatonin", "sleep", "gummies"],
      condition: "new",
    },
    {
      name: "Ensure Original Nutrition Shake 6-Pack",
      brand: "Ensure",
      description: "Meal replacement shake with 9g protein, vanilla flavor",
      cost_usd: 13,
      tags: ["nutrition-shake", "meal-replacement", "protein"],
      condition: "new",
    },
    {
      name: "Vicks VapoRub Topical Ointment 3.53oz",
      brand: "Vicks",
      description: "Cough suppressant and topical analgesic for cold symptoms",
      cost_usd: 8,
      tags: ["cold", "cough", "topical"],
      condition: "new",
    },
    {
      name: "Colgate Total Whitening Toothpaste 2-Pack",
      brand: "Colgate",
      description: "Advanced whitening toothpaste with stannous fluoride",
      cost_usd: 7,
      tags: ["toothpaste", "whitening", "oral-care"],
      condition: "new",
    },
  ],
  "food-snacks": [
    {
      name: "Trader Joe's Dark Chocolate Almonds",
      brand: "Trader Joe's",
      description: "Roasted almonds coated in rich dark chocolate, 16oz bag",
      cost_usd: 8,
      tags: ["chocolate", "almonds", "snack"],
      condition: "new",
    },
    {
      name: "Ghirardelli Chocolate Squares Assorted",
      brand: "Ghirardelli",
      description: "Premium chocolate squares in caramel, mint, and dark varieties",
      cost_usd: 12,
      tags: ["chocolate", "assorted", "premium"],
      condition: "new",
    },
    {
      name: "Snyder's Pretzel Pieces Honey Mustard",
      brand: "Snyder's",
      description: "Crunchy seasoned pretzel pieces, 12oz sharing bag",
      cost_usd: 5,
      tags: ["pretzels", "snack", "honey-mustard"],
      condition: "new",
    },
    {
      name: "SPAM Classic 12oz Can",
      brand: "SPAM",
      description: "Classic canned meat, a Filipino favorite for breakfast",
      cost_usd: 4,
      tags: ["canned", "meat", "breakfast"],
      condition: "new",
    },
    {
      name: "Skippy Creamy Peanut Butter 40oz",
      brand: "Skippy",
      description: "Smooth and creamy peanut butter, extra large jar",
      cost_usd: 7,
      tags: ["peanut-butter", "spread", "pantry"],
      condition: "new",
    },
    {
      name: "Oreo Double Stuf Cookies Family Size",
      brand: "Oreo",
      description: "Classic chocolate sandwich cookies with extra creme filling",
      cost_usd: 6,
      tags: ["cookies", "oreo", "snack"],
      condition: "new",
    },
    {
      name: "Haribo Gold Bears Gummy 5lb Bag",
      brand: "Haribo",
      description: "Classic gummy bears in fruit flavors, party-size bag",
      cost_usd: 14,
      tags: ["gummy", "candy", "party-size"],
      condition: "new",
    },
    {
      name: "Kinder Bueno Chocolate Bars 8-Pack",
      brand: "Kinder",
      description: "Crispy wafer bars filled with hazelnut cream and chocolate",
      cost_usd: 10,
      tags: ["chocolate", "wafer", "hazelnut"],
      condition: "new",
    },
    {
      name: "Pringles Sour Cream & Onion 5.5oz",
      brand: "Pringles",
      description: "Stackable potato crisps with tangy sour cream flavor",
      cost_usd: 5,
      tags: ["chips", "snack", "sour-cream"],
      condition: "new",
    },
    {
      name: "M&M's Peanut Family Size 18oz",
      brand: "M&M's",
      description: "Chocolate candy with peanuts in colorful candy shell",
      cost_usd: 9,
      tags: ["chocolate", "peanut", "candy"],
      condition: "new",
    },
    {
      name: "Nutella Hazelnut Spread 26.5oz",
      brand: "Nutella",
      description: "Creamy chocolate hazelnut spread for bread and snacks",
      cost_usd: 8,
      tags: ["spread", "chocolate", "hazelnut"],
      condition: "new",
    },
    {
      name: "Kirkland Mixed Nuts 2.5lb",
      brand: "Kirkland",
      description: "Premium salted mixed nuts with cashews, almonds, and pecans",
      cost_usd: 16,
      tags: ["nuts", "mixed", "snack"],
      condition: "new",
    },
    {
      name: "Swiss Miss Hot Cocoa Mix 30-Pack",
      brand: "Swiss Miss",
      description: "Classic hot chocolate mix with marshmallows, individual packets",
      cost_usd: 7,
      tags: ["hot-cocoa", "chocolate", "drink"],
      condition: "new",
    },
  ],
  "home-kitchen": [
    {
      name: "Stanley Quencher 40oz Tumbler",
      brand: "Stanley",
      description: "Double-wall vacuum insulated tumbler with handle, Cream color",
      cost_usd: 35,
      tags: ["tumbler", "insulated", "trending"],
      condition: "new",
    },
    {
      name: "Instant Pot Duo 7-in-1 6Qt",
      brand: "Instant Pot",
      description: "Multi-use pressure cooker, slow cooker, rice cooker, and more",
      cost_usd: 79,
      tags: ["pressure-cooker", "kitchen", "multi-use"],
      condition: "new",
    },
    {
      name: "Yankee Candle Vanilla Cupcake Large Jar",
      brand: "Yankee Candle",
      description: "Premium scented candle with 110-150 hours burn time",
      cost_usd: 28,
      tags: ["candle", "vanilla", "home-fragrance"],
      condition: "new",
    },
    {
      name: "OXO Good Grips 3-Piece Mixing Bowl Set",
      brand: "OXO",
      description: "Non-slip mixing bowls with pour spouts in 1.5, 3, and 5 Qt",
      cost_usd: 25,
      tags: ["mixing-bowls", "kitchen", "baking"],
      condition: "new",
    },
    {
      name: "KitchenAid Hand Mixer 5-Speed",
      brand: "KitchenAid",
      description: "Compact electric hand mixer with stainless steel turbo beaters",
      cost_usd: 49,
      tags: ["mixer", "baking", "kitchenaid"],
      condition: "new",
    },
    {
      name: "Mrs. Meyer's Clean Day Multi-Surface Cleaner",
      brand: "Mrs. Meyer's",
      description: "Lavender scented household cleaner made with essential oils",
      cost_usd: 5,
      tags: ["cleaner", "natural", "lavender"],
      condition: "new",
    },
    {
      name: "Corelle Dinnerware Set 12-Piece",
      brand: "Corelle",
      description: "Chip-resistant glass dinner plates, bowls, and dessert plates",
      cost_usd: 45,
      tags: ["dinnerware", "glass", "durable"],
      condition: "new",
    },
    {
      name: "Hydro Flask 32oz Wide Mouth",
      brand: "Hydro Flask",
      description: "Stainless steel insulated water bottle with flex cap",
      cost_usd: 44,
      tags: ["water-bottle", "insulated", "stainless"],
      condition: "new",
    },
    {
      name: "Lodge 10.25 Inch Cast Iron Skillet",
      brand: "Lodge",
      description: "Pre-seasoned cast iron pan for stovetop and oven cooking",
      cost_usd: 22,
      tags: ["skillet", "cast-iron", "cooking"],
      condition: "new",
    },
    {
      name: "Pyrex 8-Piece Glass Storage Set",
      brand: "Pyrex",
      description: "Oven-safe glass containers with BPA-free lids for meal prep",
      cost_usd: 19,
      tags: ["storage", "glass", "meal-prep"],
      condition: "new",
    },
    {
      name: "Clorox Disinfecting Wipes 3-Pack",
      brand: "Clorox",
      description: "Cleaning wipes that kill 99.9% of bacteria, 225 wipes total",
      cost_usd: 12,
      tags: ["wipes", "disinfecting", "cleaning"],
      condition: "new",
    },
    {
      name: "Zojirushi Stainless Mug 16oz",
      brand: "Zojirushi",
      description: "Vacuum insulated travel mug with flip-open lid, Smoky Blue",
      cost_usd: 28,
      tags: ["mug", "travel", "insulated"],
      condition: "new",
    },
  ],
  "baby-kids": [
    {
      name: "Pampers Swaddlers Size 3, 136ct",
      brand: "Pampers",
      description: "Ultra soft disposable diapers with wetness indicator",
      cost_usd: 39,
      tags: ["diapers", "baby", "pampers"],
      condition: "new",
    },
    {
      name: "Fisher-Price Laugh & Learn Smart Phone",
      brand: "Fisher-Price",
      description: "Musical toy phone with lights and learning songs for 6-36 months",
      cost_usd: 14,
      tags: ["toy", "educational", "musical"],
      condition: "new",
    },
    {
      name: "LEGO Classic Medium Creative Brick Box",
      brand: "LEGO",
      description: "484 pieces with 35 colors for open-ended building fun",
      cost_usd: 34,
      tags: ["lego", "building", "creative"],
      condition: "new",
    },
    {
      name: "Huggies Natural Care Baby Wipes 528ct",
      brand: "Huggies",
      description: "Fragrance-free sensitive baby wipes with 99% purified water",
      cost_usd: 15,
      tags: ["wipes", "baby", "sensitive"],
      condition: "new",
    },
    {
      name: "Carter's 5-Pack Short Sleeve Bodysuits",
      brand: "Carter's",
      description: "100% cotton baby bodysuits in assorted colors, 12 months",
      cost_usd: 18,
      tags: ["clothing", "baby", "cotton"],
      condition: "new",
    },
    {
      name: "Playdoh 10-Pack Modeling Compound",
      brand: "Play-Doh",
      description: "Non-toxic modeling compound in 10 fun colors, 2oz cans",
      cost_usd: 7,
      tags: ["craft", "playdoh", "creative"],
      condition: "new",
    },
    {
      name: "Baby Dove Sensitive Moisture Wash 20oz",
      brand: "Baby Dove",
      description: "Tear-free baby wash and shampoo for sensitive skin",
      cost_usd: 9,
      tags: ["wash", "baby", "sensitive"],
      condition: "new",
    },
    {
      name: "Hot Wheels 20-Car Gift Pack",
      brand: "Hot Wheels",
      description: "Set of 20 die-cast 1:64 scale toy cars in various styles",
      cost_usd: 21,
      tags: ["toy-cars", "hot-wheels", "gift-set"],
      condition: "new",
    },
    {
      name: "Enfamil NeuroPro Infant Formula 20.7oz",
      brand: "Enfamil",
      description: "Brain-building infant formula with MFGM and Omega-3 DHA",
      cost_usd: 36,
      tags: ["formula", "infant", "nutrition"],
      condition: "new",
    },
    {
      name: "Skip Hop Zoo Backpack - Unicorn",
      brand: "Skip Hop",
      description: "Insulated front pouch, mesh side pocket, cute unicorn design",
      cost_usd: 20,
      tags: ["backpack", "kids", "unicorn"],
      condition: "new",
    },
    {
      name: "Crayola 64 Crayon Box with Sharpener",
      brand: "Crayola",
      description: "Classic crayons in 64 colors with built-in sharpener",
      cost_usd: 5,
      tags: ["crayons", "art", "school"],
      condition: "new",
    },
    {
      name: "Graco Pack 'n Play Portable Playard",
      brand: "Graco",
      description: "Foldable playard with bassinet for newborns to toddlers",
      cost_usd: 69,
      tags: ["playard", "portable", "travel"],
      condition: "new",
    },
  ],
  "sports-outdoors": [
    {
      name: "Hydro Flask 24oz Standard Mouth",
      brand: "Hydro Flask",
      description: "Double wall vacuum insulated stainless steel sports bottle",
      cost_usd: 34,
      tags: ["bottle", "sports", "insulated"],
      condition: "new",
    },
    {
      name: "Nike Dri-FIT Running Shorts",
      brand: "Nike",
      description: "Lightweight breathable running shorts with moisture-wicking fabric",
      cost_usd: 30,
      tags: ["shorts", "running", "dri-fit"],
      condition: "new",
    },
    {
      name: "Fitbit Charge 6 Fitness Tracker",
      brand: "Fitbit",
      description: "Advanced tracker with GPS, heart rate, stress management, and sleep tracking",
      cost_usd: 139,
      tags: ["fitness-tracker", "gps", "heart-rate"],
      condition: "new",
    },
    {
      name: "Under Armour Tech 2.0 T-Shirt",
      brand: "Under Armour",
      description: "Quick-dry anti-odor workout shirt with loose fit",
      cost_usd: 22,
      tags: ["shirt", "workout", "quick-dry"],
      condition: "new",
    },
    {
      name: "Manduka PRO Yoga Mat 6mm",
      brand: "Manduka",
      description: "High-density cushioned yoga mat with closed-cell surface",
      cost_usd: 120,
      tags: ["yoga", "mat", "premium"],
      condition: "new",
    },
    {
      name: "Yeti Rambler 26oz Bottle",
      brand: "Yeti",
      description: "Durable stainless steel vacuum insulated bottle with chug cap",
      cost_usd: 35,
      tags: ["bottle", "yeti", "durable"],
      condition: "new",
    },
    {
      name: "Osprey Daylite Plus Daypack",
      brand: "Osprey",
      description: "20L versatile daypack for hiking and everyday carry",
      cost_usd: 65,
      tags: ["daypack", "hiking", "osprey"],
      condition: "new",
    },
    {
      name: "Speedo Vanquisher 2.0 Swim Goggles",
      brand: "Speedo",
      description: "Anti-fog mirrored lenses with UV protection for training",
      cost_usd: 18,
      tags: ["goggles", "swimming", "anti-fog"],
      condition: "new",
    },
    {
      name: "TriggerPoint GRID Foam Roller",
      brand: "TriggerPoint",
      description: "Textured foam roller for muscle recovery and deep tissue massage",
      cost_usd: 34,
      tags: ["foam-roller", "recovery", "massage"],
      condition: "new",
    },
    {
      name: "Garmin Forerunner 55 GPS Watch",
      brand: "Garmin",
      description: "Easy-to-use GPS running watch with daily suggested workouts",
      cost_usd: 149,
      tags: ["gps-watch", "running", "garmin"],
      condition: "new",
    },
    {
      name: "Coleman 2-Person Sundome Tent",
      brand: "Coleman",
      description: "Easy setup camping tent with WeatherTec system",
      cost_usd: 49,
      tags: ["tent", "camping", "outdoor"],
      condition: "new",
    },
    {
      name: "Theragun Mini 2.0 Massage Gun",
      brand: "Therabody",
      description: "Compact percussive therapy device for on-the-go muscle relief",
      cost_usd: 149,
      tags: ["massage-gun", "recovery", "portable"],
      condition: "new",
    },
  ],
};

// ─── Unsplash Product Images ──────────────────────────────────
const UNSPLASH_IMAGES: Record<string, string[]> = {
  electronics: [
    "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=600&fit=crop", // airpods
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop", // charger
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop", // mouse
    "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=600&fit=crop", // ssd
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop", // speaker
    "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop", // smartwatch
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop", // streaming stick
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop", // power bank
    "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=600&fit=crop", // headphones
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=600&fit=crop", // kindle
    "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&h=600&fit=crop", // cable
    "https://images.unsplash.com/photo-1563297007-0686b7003af7?w=600&h=600&fit=crop", // gaming mouse
    "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&h=600&fit=crop", // chromecast
  ],
  "beauty-skincare": [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop", // moisturizer
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop", // serum
    "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop", // sunscreen
    "https://images.unsplash.com/photo-1631214500115-598fc2cb8ada?w=600&h=600&fit=crop", // mascara
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop", // exfoliant
    "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&h=600&fit=crop", // lip liner
    "https://images.unsplash.com/photo-1556227702-d1e4e7b5c232?w=600&h=600&fit=crop", // body wash
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop", // cc cream
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop", // hair treatment
    "https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=600&h=600&fit=crop", // acne treatment
    "https://images.unsplash.com/photo-1595535373192-fc8935bacd89?w=600&h=600&fit=crop", // fragrance mist
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=600&fit=crop", // sponge set
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop", // cleanser
  ],
  fashion: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop", // sneakers
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=600&fit=crop", // jeans
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop", // hoodie
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=600&fit=crop", // running shoes
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop", // backpack
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop", // sunglasses
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&h=600&fit=crop", // thermal wear
    "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&h=600&fit=crop", // underwear pack
    "https://images.unsplash.com/photo-1494496195158-c3becb4f2475?w=600&h=600&fit=crop", // high-top sneakers
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop", // kanken backpack
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop", // polo shirt
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop", // watch
    "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&h=600&fit=crop", // retro sneakers
  ],
  "health-supplements": [
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop", // vitamins
    "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&h=600&fit=crop", // multivitamin
    "https://images.unsplash.com/photo-1593095948071-474c5cc2c182?w=600&h=600&fit=crop", // protein powder
    "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&h=600&fit=crop", // fish oil
    "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&h=600&fit=crop", // probiotics
    "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=600&h=600&fit=crop", // pain relief
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&h=600&fit=crop", // gummies
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=600&fit=crop", // vitamin c
    "https://images.unsplash.com/photo-1585435557343-3b0929ea0a49?w=600&h=600&fit=crop", // sleep aid
    "https://images.unsplash.com/photo-1576186726115-4d51596775d1?w=600&h=600&fit=crop", // nutrition shake
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&h=600&fit=crop", // topical ointment
    "https://images.unsplash.com/photo-1559591937-eae77e553adb?w=600&h=600&fit=crop", // toothpaste
  ],
  "food-snacks": [
    "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=600&h=600&fit=crop", // chocolate almonds
    "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&h=600&fit=crop", // chocolate squares
    "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&h=600&fit=crop", // pretzels
    "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&h=600&fit=crop", // canned food
    "https://images.unsplash.com/photo-1598511726623-d2e9996e2eae?w=600&h=600&fit=crop", // peanut butter
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=600&fit=crop", // cookies
    "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&h=600&fit=crop", // gummy bears
    "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=600&h=600&fit=crop", // chocolate bars
    "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&h=600&fit=crop", // chips
    "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=600&h=600&fit=crop", // candy
    "https://images.unsplash.com/photo-1530016724061-f81a23a9e8c6?w=600&h=600&fit=crop", // nutella
    "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&h=600&fit=crop", // mixed nuts
    "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=600&h=600&fit=crop", // hot cocoa
  ],
  "home-kitchen": [
    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop", // tumbler
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop", // pressure cooker
    "https://images.unsplash.com/photo-1602607312530-f0bfab42cc90?w=600&h=600&fit=crop", // candle
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&h=600&fit=crop", // mixing bowls
    "https://images.unsplash.com/photo-1574269910231-bc508785e534?w=600&h=600&fit=crop", // hand mixer
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&h=600&fit=crop", // cleaner
    "https://images.unsplash.com/photo-1603199506016-5d54eb9fe5f4?w=600&h=600&fit=crop", // dinnerware
    "https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=600&h=600&fit=crop", // water bottle
    "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop", // cast iron skillet
    "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&h=600&fit=crop", // glass storage
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&h=600&fit=crop", // cleaning wipes
    "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop", // travel mug
  ],
  "baby-kids": [
    "https://images.unsplash.com/photo-1584839404210-0a6d637fb9f9?w=600&h=600&fit=crop", // diapers
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=600&fit=crop", // toy phone
    "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=600&h=600&fit=crop", // lego
    "https://images.unsplash.com/photo-1607004659127-1342d3f3bce5?w=600&h=600&fit=crop", // baby wipes
    "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&h=600&fit=crop", // baby clothes
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=600&fit=crop", // playdoh
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop", // baby wash
    "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&h=600&fit=crop", // toy cars
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=600&fit=crop", // infant formula
    "https://images.unsplash.com/photo-1604917621956-10dfa7cce307?w=600&h=600&fit=crop", // kids backpack
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=600&fit=crop", // crayons
    "https://images.unsplash.com/photo-1566004100477-7b3ba27b7a76?w=600&h=600&fit=crop", // playard
  ],
  "sports-outdoors": [
    "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=600&fit=crop", // sports bottle
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop", // running shorts
    "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=600&fit=crop", // fitness tracker
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=600&fit=crop", // workout shirt
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop", // yoga mat
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop", // yeti bottle
    "https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=600&h=600&fit=crop", // daypack
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=600&fit=crop", // swim goggles
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=600&fit=crop", // foam roller
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop", // gps watch
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=600&fit=crop", // tent
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop", // massage gun
  ],
};

// ─── Seed Products ─────────────────────────────────────────────
interface SeedProduct {
  id: string;
  name: string;
  selling_price_php: number;
  status: string;
  image_url: string;
  cargo_id: string;
}

async function seedProducts(adminId: string, cargos: SeedCargo[]): Promise<SeedProduct[]> {
  console.log("Seeding products...");

  // First, fetch category IDs from the database
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, slug")
    .order("sort_order");
  if (catError || !categories) throw new Error(`Failed to fetch categories: ${catError?.message}`);

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  const allProducts: SeedProduct[] = [];
  let productIndex = 0;
  const USD_TO_PHP = 56.5;

  for (const [categorySlug, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    const categoryId = categoryMap.get(categorySlug);
    if (!categoryId) {
      console.warn(`  Warning: category "${categorySlug}" not found, skipping.`);
      continue;
    }

    for (const p of products) {
      productIndex++;

      // Determine status and cargo assignment
      let status: "active" | "draft" | "sold_out" | "archived";
      let cargoId: string;
      let fulfillmentType: "in_stock" | "pre_order";
      let quantitySold: number;

      if (productIndex <= 70) {
        // Active in-stock (arrived box)
        status = "active";
        cargoId = cargos[0].id;
        fulfillmentType = "in_stock";
        quantitySold = randomBetween(0, 3);
      } else if (productIndex <= 90) {
        // Active pre-order (in-transit box)
        status = "active";
        cargoId = cargos[1].id;
        fulfillmentType = "pre_order";
        quantitySold = 0;
      } else if (productIndex <= 95) {
        // Draft (purchased box)
        status = "draft";
        cargoId = cargos[2].id;
        fulfillmentType = "pre_order";
        quantitySold = 0;
      } else if (productIndex <= 98) {
        // Sold out
        status = "sold_out";
        cargoId = cargos[0].id;
        fulfillmentType = "in_stock";
        quantitySold = 0; // will set = quantity_total below
      } else {
        // Archived
        status = "archived";
        cargoId = cargos[0].id;
        fulfillmentType = "in_stock";
        quantitySold = 0;
      }

      const quantityTotal = status === "sold_out" ? randomBetween(2, 5) : randomBetween(1, 10);
      if (status === "sold_out") {
        quantitySold = quantityTotal;
      }

      // Pricing: 25-40% markup over USD cost converted to PHP
      const markupPct = randomDecimal(1.25, 1.4);
      const sellingPricePHP = Math.round(p.cost_usd * USD_TO_PHP * markupPct);
      const shippingAllocation = Math.round(p.cost_usd * 0.05 * USD_TO_PHP); // ~5% of cost

      // Compare at price (60% of products)
      const hasCompareAt = Math.random() < 0.6;
      const compareAtPricePHP = hasCompareAt
        ? Math.round(sellingPricePHP * randomDecimal(1.1, 1.3))
        : null;

      const isFeatured = productIndex <= 15;
      const slug = slugify(p.name);

      const categoryImages = UNSPLASH_IMAGES[categorySlug] ?? [];
      const imgIndex = (productIndex - 1) % (categoryImages.length || 1);
      const imageUrl =
        categoryImages.length > 0
          ? `${categoryImages[imgIndex]}&crop=center`
          : `https://placehold.co/600x600/e2e8f0/475569?text=${encodeURIComponent(p.name.slice(0, 20))}`;

      const { data: product, error: prodError } = await supabase
        .from("products")
        .insert({
          category_id: categoryId,
          name: p.name,
          slug,
          description: p.description,
          brand: p.brand,
          condition: p.condition,
          cost_usd: p.cost_usd,
          shipping_allocation_php: shippingAllocation,
          selling_price_php: sellingPricePHP,
          compare_at_price_php: compareAtPricePHP,
          quantity_total: quantityTotal,
          quantity_sold: quantitySold,
          quantity_reserved: 0,
          status,
          is_featured: isFeatured,
          cargo_id: cargoId,
          added_by: adminId,
          tags: p.tags,
        })
        .select("id")
        .single();

      if (prodError) throw new Error(`Failed to create product "${p.name}": ${prodError.message}`);

      allProducts.push({
        id: product.id,
        name: p.name,
        selling_price_php: sellingPricePHP,
        status,
        image_url: imageUrl,
        cargo_id: cargoId,
      });

      // Product images (1-3 per product)
      const imageCount = randomBetween(1, 3);
      const crops = ["center", "top", "left"];
      const images = [];
      for (let i = 0; i < imageCount; i++) {
        const photoUrl =
          categoryImages.length > 0
            ? `${categoryImages[(imgIndex + i) % categoryImages.length]}&crop=${crops[i]}`
            : `https://placehold.co/600x600/e2e8f0/475569?text=${encodeURIComponent(p.name.slice(0, 20))}`;
        images.push({
          product_id: product.id,
          url: photoUrl,
          alt_text: `${p.name} - image ${i + 1}`,
          sort_order: i,
        });
      }
      await supabase.from("product_images").insert(images);

      // Variants (~30 products get 1-2 variants)
      if (productIndex % 3 === 0 && productIndex <= 90) {
        const variantType = pick(["size", "color"]);
        const variantOptions =
          variantType === "size" ? ["Small", "Medium", "Large"] : ["Black", "White", "Navy"];
        const variantCount = randomBetween(1, 2);

        for (let v = 0; v < variantCount; v++) {
          await supabase.from("product_variants").insert({
            product_id: product.id,
            name: `${variantType}: ${variantOptions[v]}`,
            sku: `${slug}-${variantOptions[v].toLowerCase()}`.slice(0, 50),
            price_adjustment_php: v === 0 ? 0 : randomBetween(50, 200),
            quantity_total: randomBetween(1, 5),
          });
        }
      }
    }
  }

  console.log(`  Created ${allProducts.length} products with images and variants.`);
  return allProducts;
}

// ─── Seed Orders ───────────────────────────────────────────────
interface SeedOrder {
  id: string;
  customer_id: string;
  status: string;
  total_php: number;
}

async function seedOrders(
  customers: SeedUser[],
  products: SeedProduct[],
  arrivedCargoId: string,
): Promise<SeedOrder[]> {
  console.log("Seeding orders...");

  const activeProducts = products.filter(
    (p) => p.status === "active" && p.cargo_id === arrivedCargoId,
  );

  // 3 orders per customer (15 total). Mix of statuses.
  // 7 delivered, 3 shipped_local, 2 ready, 2 confirmed, 1 pending
  const orderStatuses: Array<{
    status: "delivered" | "shipped_local" | "ready" | "confirmed" | "pending";
    paymentStatus: "paid" | "partial" | "pending";
  }> = [
    { status: "delivered", paymentStatus: "paid" },
    { status: "delivered", paymentStatus: "paid" },
    { status: "shipped_local", paymentStatus: "paid" },
    { status: "delivered", paymentStatus: "paid" },
    { status: "confirmed", paymentStatus: "pending" },
    { status: "ready", paymentStatus: "partial" },
    { status: "delivered", paymentStatus: "paid" },
    { status: "shipped_local", paymentStatus: "paid" },
    { status: "delivered", paymentStatus: "paid" },
    { status: "pending", paymentStatus: "pending" },
    { status: "delivered", paymentStatus: "paid" },
    { status: "shipped_local", paymentStatus: "paid" },
    { status: "ready", paymentStatus: "partial" },
    { status: "delivered", paymentStatus: "paid" },
    { status: "confirmed", paymentStatus: "pending" },
  ];

  const allOrders: SeedOrder[] = [];
  let statusIdx = 0;

  for (const customer of customers) {
    // Get customer profile for delivery address
    const { data: profile } = await supabase
      .from("profiles")
      .select("address_line, city, province, zip_code")
      .eq("id", customer.id)
      .single();

    if (!profile) continue;

    for (let o = 0; o < 3; o++) {
      const { status, paymentStatus } = orderStatuses[statusIdx % orderStatuses.length];
      statusIdx++;

      // Pick 2-4 random products for order items
      const itemCount = randomBetween(2, 4);
      const orderProducts: SeedProduct[] = [];
      const usedIndices = new Set<number>();

      while (orderProducts.length < itemCount) {
        const idx = randomBetween(0, activeProducts.length - 1);
        if (!usedIndices.has(idx)) {
          usedIndices.add(idx);
          orderProducts.push(activeProducts[idx]);
        }
      }

      // Calculate totals
      const items = orderProducts.map((p) => {
        const qty = randomBetween(1, 2);
        return {
          product: p,
          quantity: qty,
          unit_price: p.selling_price_php,
          total_price: p.selling_price_php * qty,
        };
      });

      const subtotal = items.reduce((sum, i) => sum + i.total_price, 0);
      const shippingFee = pick([0, 100, 150, 200]);
      const discount = Math.random() < 0.2 ? randomBetween(50, 200) : 0;
      const total = subtotal + shippingFee - discount;

      const createdAt = daysAgo(randomBetween(1, 45));

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          status,
          subtotal_php: subtotal,
          shipping_fee_php: shippingFee,
          discount_php: discount,
          total_php: total,
          payment_status: paymentStatus,
          has_pre_order_items: false,
          delivery_address: profile.address_line ?? "",
          delivery_city: profile.city ?? "",
          delivery_province: profile.province ?? "",
          delivery_zip: profile.zip_code ?? "",
          customer_notes:
            Math.random() < 0.3
              ? pick([
                  "Please handle with care po",
                  "Pwede po ba i-deliver sa guard?",
                  "Text me before delivery po",
                  "Salamat po!",
                ])
              : null,
          created_at: createdAt,
        } as Record<string, unknown>)
        .select("id")
        .single();

      if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

      allOrders.push({
        id: order.id,
        customer_id: customer.id,
        status,
        total_php: total,
      });

      // Insert order items
      for (const item of items) {
        await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price_php: item.unit_price,
          total_price_php: item.total_price,
          fulfillment_type: "in_stock",
          cargo_id: arrivedCargoId,
          product_name: item.product.name,
          product_image_url: item.product.image_url,
        });
      }
    }
  }

  console.log(`  Created ${allOrders.length} orders with items.`);
  return allOrders;
}

// ─── Seed Payments ─────────────────────────────────────────────
async function seedPayments(orders: SeedOrder[], adminId: string) {
  console.log("Seeding payments...");

  // Only create payments for orders that have payment_status paid or partial
  const paidOrders = orders.filter(
    (o) => o.status === "delivered" || o.status === "shipped_local" || o.status === "ready",
  );

  let paymentCount = 0;

  for (const order of paidOrders) {
    const method = pick<"gcash" | "bank_transfer" | "cash">(["gcash", "bank_transfer", "cash"]);
    const isVerified = order.status === "delivered" || order.status === "shipped_local";
    const amount =
      order.status === "ready"
        ? Math.round(order.total_php * 0.5) // Partial payment
        : order.total_php; // Full payment

    await supabase.from("payments").insert({
      order_id: order.id,
      amount_php: amount,
      method,
      reference_number:
        method === "cash"
          ? null
          : `${method === "gcash" ? "GC" : "BT"}-${Date.now()}-${paymentCount}`,
      verified: isVerified,
      verified_at: isVerified ? daysAgo(randomBetween(0, 5)) : null,
      verified_by: isVerified ? adminId : null,
      paid_at: daysAgo(randomBetween(1, 10)),
    });

    paymentCount++;

    if (paymentCount >= 10) break;
  }

  console.log(`  Created ${paymentCount} payments.`);
}

// ─── Seed Reviews ──────────────────────────────────────────────
async function seedReviews(orders: SeedOrder[], products: SeedProduct[]) {
  console.log("Seeding reviews...");

  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  const reviewComments = [
    "Super ganda ng quality! Worth it talaga.",
    "Legit na legit, same as US store!",
    "Medyo matagal ang delivery pero ok naman yung product.",
    "Love it! Mag-order ulit ako next time.",
    "Sakto sa budget, good quality din.",
    "Ang bilis ng delivery! Thank you!",
    "Sulit na sulit, highly recommended!",
    "Nice packaging, di nasira.",
    "Ok naman, pero expected ko na mas malaki.",
    "Perfect! Exactly what I wanted.",
    "Great deal, mas mura pa dito kaysa sa mall!",
    "Will order again, very satisfied.",
    "Smooth transaction, friendly seller!",
    "Authentic product, nakaka-happy!",
    "Good quality for the price. Di nakakahinayang.",
    "Mabilis mag-respond sa messages. Thumbs up!",
    "Parang brand new talaga, super happy!",
    "Sulit sa presyo, orig na orig!",
    "Thank you Pabakal, legit kayo!",
    "Sobrang bilis dumating, di ko inexpect!",
  ];

  let reviewCount = 0;

  for (const order of deliveredOrders) {
    if (reviewCount >= 20) break;

    // Get order items to know which products to review
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id")
      .eq("order_id", order.id);

    if (!orderItems) continue;

    // Review all products from delivered orders to reach target of 20
    const itemsToReview = orderItems;

    for (const item of itemsToReview) {
      if (reviewCount >= 20) break;

      // Check if product exists in our list (to avoid FK issues)
      const product = products.find((p) => p.id === item.product_id);
      if (!product) continue;

      const { error } = await supabase.from("reviews").insert({
        product_id: item.product_id,
        customer_id: order.customer_id,
        order_id: order.id,
        rating: randomBetween(3, 5),
        comment: pick(reviewComments),
        is_visible: true,
      });

      if (!error) reviewCount++;
    }
  }

  console.log(`  Created ${reviewCount} reviews.`);
}

// ─── Seed Notifications ────────────────────────────────────────
async function seedNotifications(customers: SeedUser[], adminId: string) {
  console.log("Seeding notifications...");

  const notifications = [
    {
      user_id: customers[0].id,
      title: "Order Delivered",
      body: "Your order has been successfully delivered. Enjoy your items!",
      type: "order_update",
      is_read: true,
    },
    {
      user_id: customers[0].id,
      title: "New Products Available",
      body: "Check out our latest arrivals from the US!",
      type: "promotion",
      is_read: false,
    },
    {
      user_id: customers[1].id,
      title: "Payment Verified",
      body: "Your GCash payment has been verified. We're preparing your order.",
      type: "payment_update",
      is_read: true,
    },
    {
      user_id: customers[1].id,
      title: "Order Shipped",
      body: "Your order is on its way! Expected delivery in 2-3 days.",
      type: "order_update",
      is_read: false,
    },
    {
      user_id: customers[2].id,
      title: "Order Confirmed",
      body: "Your order has been confirmed. We'll start preparing it soon.",
      type: "order_update",
      is_read: true,
    },
    {
      user_id: customers[3].id,
      title: "New Cargo Arriving",
      body: "A new balikbayan box is on its way! Pre-order items now.",
      type: "cargo_update",
      is_read: false,
    },
    {
      user_id: customers[4].id,
      title: "Welcome to Pabakal!",
      body: "Thanks for joining. Browse our products from the US at great prices!",
      type: "system",
      is_read: true,
    },
    {
      user_id: adminId,
      title: "New Order Received",
      body: "A new order has been placed. Check your dashboard for details.",
      type: "order_update",
      is_read: false,
    },
    {
      user_id: adminId,
      title: "Payment Pending Verification",
      body: "A customer has submitted payment proof. Please verify.",
      type: "payment_update",
      is_read: false,
    },
    {
      user_id: adminId,
      title: "Cargo Status Update",
      body: "Box #2026-01 is now in transit. ETA: 2 weeks.",
      type: "cargo_update",
      is_read: true,
    },
  ];

  for (const n of notifications) {
    await supabase.from("notifications").insert({
      ...n,
      created_at: daysAgo(randomBetween(0, 14)),
    });
  }

  console.log(`  Created ${notifications.length} notifications.`);
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("\n========================================");
  console.log("  Pabakal Database Seed Script");
  console.log("========================================\n");

  const startTime = Date.now();

  await cleanup();

  const { admins, customers } = await seedUsers();
  await seedExchangeRate(admins[0].id);
  const cargos = await seedCargos(admins[1].id); // Aunt creates cargos
  const products = await seedProducts(admins[1].id, cargos);
  const orders = await seedOrders(customers, products, cargos[0].id);
  await seedPayments(orders, admins[0].id);
  await seedReviews(orders, products);
  await seedNotifications(customers, admins[0].id);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n========================================");
  console.log("  Seed complete!");
  console.log(`  Time: ${elapsed}s`);
  console.log("========================================");
  console.log("\nTest accounts:");
  console.log("  Admin:    admin@pabakal.com / password123");
  console.log("  Admin:    aunt@pabakal.com  / password123");
  console.log("  Customer: customer1@example.com / password123");
  console.log("  Customer: customer2@example.com / password123");
  console.log("  Customer: customer3@example.com / password123");
  console.log("  Customer: customer4@example.com / password123");
  console.log("  Customer: customer5@example.com / password123\n");
}

main().catch((err) => {
  console.error("\nSeed failed:", err);
  process.exit(1);
});
