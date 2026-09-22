# Biher Salary

A dashboard for calculating university staff salaries.

- **Public page (`/`)**: staff pick their department, qualification (ME/PhD)
  and experience (years + months); the app computes their salary by linearly
  interpolating between the department/qualification's configured min and
  max salary over the configured min/max experience range. Experience beyond
  the configured maximum is capped at the maximum.
- **Admin page (`/admin`)**: password-protected. Add/edit/delete
  departments; each department has independent ME and PhD salary ranges,
  each with its own min/max experience range (so e.g. CSE-ME and CSE-PhD
  can use different experience caps).
- **Calculation history (`/dev`)**: browse CSV uploads and manual
  calculations. Visible to both admin and dev accounts.
- **Accounts (`/dev/accounts`, dev role only)**: invite new admin/dev
  accounts by email, disable/enable them, or remove them. Invited people get
  an emailed setup link where they choose their name, designation and
  password on first sign-in.
- **Account settings (`/account`)**: every signed-in user can update their
  name, designation, email and password. Changing the email sends a
  verification link to the new address; the change applies when it is
  clicked and the user is asked to sign in again. "Forgot password" on the
  login page emails a reset link.

Built with Next.js (App Router), Drizzle ORM, and Neon Postgres.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Neon Postgres project at [neon.tech](https://neon.tech) and copy
   its connection string.

3. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL`: your Neon connection string.
   - `SESSION_SECRET`: any random string of 32+ characters (used to encrypt
     the admin session cookie). You can generate one with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `DEV_USERNAME` / `DEV_PASSWORD`: the initial dev login, used only by the
     seed script below. Set `DEV_EMAIL` too so that account can use "Forgot
     password". Admin accounts are not seeded; the dev invites them from
     `/dev/accounts`.
   - `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`:
     used to send invitation and password reset emails. If unset, emails are
     printed to the server console instead.
   - `APP_URL`: optional absolute origin for emailed links.
   - `SUPPORT_EMAIL`: shown as the "Support" link on the dashboards.

4. Push the schema to your database:

   ```bash
   npm run db:push
   ```

   If you are upgrading an existing database that already has an `admins`
   table, run `npm run db:migrate-accounts` instead of `db:push` once; it adds
   the account-management columns without touching existing rows.

5. Seed the initial dev account:

   ```bash
   npm run db:seed
   ```

6. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) for the calculator,
   and [http://localhost:3000/admin](http://localhost:3000/admin) to log in
   and configure departments.

## Notes

- No departments exist until an admin adds them from `/admin`, so the public
  calculator will show an empty state until then.
- `npm run db:studio` opens Drizzle Studio to browse/edit the database
  directly.
