import "dotenv/config";
import { setDefaultResultOrder } from "node:dns";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { admins } from "./schema";

// See src/instrumentation.ts for why this is needed on this machine.
setDefaultResultOrder("ipv4first");

async function seedAccount(
  username: string | undefined,
  password: string | undefined,
  email: string | undefined,
  role: "admin" | "dev",
) {
  if (!username || !password) {
    return;
  }

  const normalizedEmail = email?.trim().toLowerCase() || null;

  const existing = await db
    .select()
    .from(admins)
    .where(eq(admins.username, username));

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db
      .insert(admins)
      .values({ username, passwordHash, role, email: normalizedEmail });
    console.log(`Created ${role} user "${username}".`);
  } else {
    if (normalizedEmail && !existing[0].email) {
      await db
        .update(admins)
        .set({ email: normalizedEmail })
        .where(eq(admins.id, existing[0].id));
      console.log(`Set email for existing user "${username}".`);
    } else {
      console.log(`User "${username}" already exists, skipping.`);
    }
  }
}

// Only the dev account is seeded. Admin accounts are invited by the dev
// from /dev/accounts, which emails them a setup link.
async function main() {
  if (!process.env.DEV_USERNAME || !process.env.DEV_PASSWORD) {
    throw new Error(
      "Set DEV_USERNAME and DEV_PASSWORD in your .env file before seeding.",
    );
  }

  await seedAccount(
    process.env.DEV_USERNAME,
    process.env.DEV_PASSWORD,
    process.env.DEV_EMAIL,
    "dev",
  );

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
