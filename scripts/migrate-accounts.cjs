// One-off migration for the account management feature: adds email, name,
// designation and disabled columns to `admins`, makes username/password
// nullable, creates the `account_tokens` table, and adds email-change
// verification support to it.
//
// Run once with:  npm run db:migrate-accounts
//
// Use this instead of `drizzle-kit push` for this change: push offers to
// truncate the admins table when adding the unique email constraint. This
// script keeps existing rows. It is safe to re-run (each step is skipped if
// already applied).
require("dotenv/config");
require("node:dns").setDefaultResultOrder("ipv4first");
const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `DO $$ BEGIN
     CREATE TYPE "public"."token_purpose" AS ENUM('setup', 'reset');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `ALTER TABLE "admins" ALTER COLUMN "username" DROP NOT NULL`,
  `ALTER TABLE "admins" ALTER COLUMN "password_hash" DROP NOT NULL`,
  `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "email" text`,
  `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "name" text`,
  `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "designation" text`,
  `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "disabled" boolean DEFAULT false NOT NULL`,
  `DO $$ BEGIN
     ALTER TABLE "admins" ADD CONSTRAINT "admins_email_unique" UNIQUE("email");
   EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "account_tokens" (
     "id" serial PRIMARY KEY NOT NULL,
     "admin_id" integer NOT NULL,
     "token_hash" text NOT NULL,
     "purpose" "token_purpose" NOT NULL,
     "expires_at" timestamp NOT NULL,
     "used_at" timestamp,
     "created_at" timestamp DEFAULT now() NOT NULL,
     CONSTRAINT "account_tokens_token_hash_unique" UNIQUE("token_hash")
   )`,
  `DO $$ BEGIN
     ALTER TABLE "account_tokens" ADD CONSTRAINT "account_tokens_admin_id_admins_id_fk"
       FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  // Email-change verification (added later; idempotent).
  `ALTER TYPE "public"."token_purpose" ADD VALUE IF NOT EXISTS 'email_change'`,
  `ALTER TABLE "account_tokens" ADD COLUMN IF NOT EXISTS "new_email" text`,
];

(async () => {
  for (const statement of statements) {
    await sql.query(statement);
    console.log("ok:", statement.replace(/\s+/g, " ").slice(0, 80));
  }
  const result = await sql.query(
    `SELECT id, username, email, role, disabled, (password_hash IS NOT NULL) AS has_password FROM admins ORDER BY id`,
  );
  console.table(result.rows ?? result);
  console.log("Migration complete.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
