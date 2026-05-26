import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Platform catalog with badge styles + IGDB platform IDs.
 * IGDB IDs reference: https://api-docs.igdb.com/#platform
 */
const PLATFORMS = [
  // PlayStation
  { name: "PlayStation 5",       slug: "ps5",        family: "PlayStation", igdbIds: [167],     badgeText: "PS5", badgeBg: "#006FCD", badgeFg: "#ffffff" },
  { name: "PlayStation 4",       slug: "ps4",        family: "PlayStation", igdbIds: [48],      badgeText: "PS4", badgeBg: "#003791", badgeFg: "#ffffff" },
  { name: "PlayStation 3",       slug: "ps3",        family: "PlayStation", igdbIds: [9],       badgeText: "PS3", badgeBg: "#003087", badgeFg: "#ffffff" },
  { name: "PS Vita",             slug: "ps-vita",    family: "PlayStation", igdbIds: [46],      badgeText: "VITA", badgeBg: "#000000", badgeFg: "#ffffff" },
  // Xbox
  { name: "Xbox Series X|S",     slug: "xsx",        family: "Xbox",        igdbIds: [169],     badgeText: "XSX", badgeBg: "#107C10", badgeFg: "#ffffff" },
  { name: "Xbox One",            slug: "xbone",      family: "Xbox",        igdbIds: [49],      badgeText: "XB1", badgeBg: "#107C10", badgeFg: "#ffffff" },
  { name: "Xbox 360",            slug: "x360",       family: "Xbox",        igdbIds: [12],      badgeText: "360", badgeBg: "#5DC21E", badgeFg: "#ffffff" },
  // Nintendo
  { name: "Nintendo Switch 2",   slug: "switch2",    family: "Nintendo",    igdbIds: [508],     badgeText: "NS2", badgeBg: "#E60012", badgeFg: "#ffffff" },
  { name: "Nintendo Switch",     slug: "switch",     family: "Nintendo",    igdbIds: [130],     badgeText: "NS",  badgeBg: "#E60012", badgeFg: "#ffffff" },
  { name: "Wii U",               slug: "wiiu",       family: "Nintendo",    igdbIds: [41],      badgeText: "WIIU",badgeBg: "#009ac7", badgeFg: "#ffffff" },
  { name: "Wii",                 slug: "wii",        family: "Nintendo",    igdbIds: [5],       badgeText: "WII", badgeBg: "#ffffff", badgeFg: "#000000" },
  { name: "Nintendo 3DS",        slug: "3ds",        family: "Nintendo",    igdbIds: [37],      badgeText: "3DS", badgeBg: "#D12228", badgeFg: "#ffffff" },
  { name: "Nintendo DS",         slug: "ds",         family: "Nintendo",    igdbIds: [20],      badgeText: "DS",  badgeBg: "#a6a6a6", badgeFg: "#000000" },
  // PC
  { name: "PC",                  slug: "pc",         family: "PC",          igdbIds: [6],       badgeText: "PC",  badgeBg: "#1B2838", badgeFg: "#ffffff" },
  { name: "Steam Deck",          slug: "steam-deck", family: "PC",          igdbIds: [],        badgeText: "SD",  badgeBg: "#1A9FFF", badgeFg: "#ffffff" },
  { name: "Mac",                 slug: "mac",        family: "PC",          igdbIds: [14],      badgeText: "MAC", badgeBg: "#000000", badgeFg: "#ffffff" },
  // Mobile
  { name: "iOS",                 slug: "ios",        family: "Mobile",      igdbIds: [39],      badgeText: "iOS", badgeBg: "#0a84ff", badgeFg: "#ffffff" },
  { name: "Android",             slug: "android",    family: "Mobile",      igdbIds: [34],      badgeText: "AND", badgeBg: "#3DDC84", badgeFg: "#000000" },
];

async function main() {
  console.log("→ Seeding platforms with badges + IGDB mapping…");
  for (const p of PLATFORMS) {
    await prisma.platform.upsert({
      where: { slug: p.slug },
      update: {
        igdbIds: p.igdbIds,
        badgeText: p.badgeText,
        badgeBg: p.badgeBg,
        badgeFg: p.badgeFg,
        family: p.family,
        name: p.name,
      },
      create: p,
    });
  }

  const user = await prisma.user.upsert({
    where: { email: "me@memorycard.local" },
    update: {},
    create: { email: "me@memorycard.local", name: "Player One" },
  });
  console.log(`→ Default user: ${user.email}`);
  console.log("✓ Done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
