import Link from "next/link";
import Logo from "@/components/Logo";
import { logoutAction } from "@/app/admin/login/actions";
import { displayName, type CurrentUser } from "@/lib/auth";

interface HeaderLink {
  href: string;
  label: string;
}

const linkClass =
  "rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

export default function DashboardHeader({
  title,
  user,
  links = [],
}: {
  title: string;
  user: CurrentUser;
  links?: HeaderLink[];
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Logo />
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Signed in as {displayName(user)}
            {user.designation ? ` · ${user.designation}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={linkClass}>
            {l.label}
          </Link>
        ))}
        <Link href="/account" className={linkClass}>
          Account settings
        </Link>
        <form action={logoutAction}>
          <button type="submit" className={linkClass}>
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
