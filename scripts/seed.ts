/**
 * Development seed script — run with `npm run seed`.
 *
 * Idempotent: re-running it updates the same "Wolf's Law" workshop (matched
 * by slug) instead of creating a duplicate, and only creates the admin user
 * if one with that email doesn't already exist yet (it never resets an
 * existing admin's password).
 */
import fs from "node:fs";
import path from "node:path";

// tsx doesn't auto-load .env.local the way `next dev` does, so load it manually
// before anything that reads process.env (connectToDatabase, JWT_SECRET, etc.).
function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connect";
import { Workshop } from "../src/models/Workshop";
import { AdminUser } from "../src/models/AdminUser";
import { hashPassword } from "../src/lib/auth/password";

const WORKSHOP_SLUG = "wolfs-law";

async function seedWorkshop(): Promise<void> {
  const workshopData = {
    title: "Wolf's Law",
    subtitle: "Every Woman Above 50 Should Know This To Make Their Bones Strong",
    description:
      "Wolf's Law is a real principle of bone biology: bones grow stronger under the right kind of mechanical stress, and weaker without it. Most women over 50 have never been taught how to use this to their advantage.\n\nIn this live Zoom workshop from Stronger Steps, Dr. Nikhil Mehra and Dr. Akhila walk you through exactly why bone density quietly declines after 50, and how a few simple, safe movements can trigger your body to rebuild stronger bone — no gym, no equipment, no risk of injury.\n\nThis session is designed specifically for women who want to protect themselves against osteoporosis and fractures, and take an active role in their own bone health.",
    bannerImage: "/assets/images/hero.png",
    date: new Date("2026-07-18"),
    time: "6:00 PM - 8:00 PM",
    duration: "2 hours",
    price: 49,
    originalPrice: 199,
    doctors: [{ name: "Dr. Nikhil Mehra" }, { name: "Dr. Akhila" }],
    benefits: [
      "What Wolf's Law means for your bones after 50",
      "Why bone density quietly declines with age",
      "The hidden cycle of bone weakening and inactivity",
      "How the right movement can rebuild bone strength safely",
      "Simple exercises that trigger Wolf's Law for stronger bones",
      "Daily habits that help protect against osteoporosis and fractures",
    ],
    passIncludes: ["Live Zoom workshop access", "Session recording", "Bonus exercise guide PDF"],
    agenda: [
      { icon: "💻", text: "Live guided Zoom session" },
      { icon: "💬", text: "Interactive discussion" },
      { icon: "❓", text: "Question & Answer session" },
    ],
    faq: [
      {
        question: "Is this workshop conducted online?",
        answer: "Yes — this is a live Zoom Online Workshop. You'll receive the joining link after you register.",
      },
      {
        question: "Do I need any equipment?",
        answer: "No. Every movement shown can be done at home with no equipment, in comfortable clothing.",
      },
      {
        question: "Will I get a recording if I can't attend live?",
        answer: "The session is designed to be interactive and is best experienced live, so we recommend blocking the time on your calendar.",
      },
      {
        question: "How do I access the WhatsApp community after registering?",
        answer: "You'll get a link to join right after you register — it's where we share reminders and stay connected between sessions.",
      },
    ],
    zoomLink: "https://zoom.us/j/1234567890",
    whatsappCommunityLink: "https://chat.whatsapp.com/I1fzeAul9ogBT6d9mZczqt",
    registrationLimit: 100,
    status: "published" as const,
    featured: true,
    seoTitle: "Wolf's Law | Stronger Steps — Bone Strength Workshop for Women Over 50",
    seoDescription:
      "Join the Wolf's Law online workshop by Stronger Steps — a guided Zoom session helping women over 50 understand bone health and build stronger, fracture-resistant bones.",
    slug: WORKSHOP_SLUG,
  };

  const result = await Workshop.findOneAndUpdate(
    { slug: WORKSHOP_SLUG },
    { $set: workshopData },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  console.log(`Workshop "${result.title}" (slug: ${result.slug}) is seeded. _id=${result._id.toString()}`);
}

async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.warn("ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set — skipping admin user seed.");
    return;
  }

  const existing = await AdminUser.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Admin user ${email} already exists — leaving it untouched.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await AdminUser.create({ email, passwordHash, role: "superadmin" });
  console.log(`Created admin user ${email}.`);
}

async function main() {
  await connectToDatabase();
  await seedWorkshop();
  await seedAdminUser();
  await mongoose.connection.close();
  console.log("Seed complete.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
