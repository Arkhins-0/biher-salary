// Support contact shown in the corner of the dashboards. Configured via the
// SUPPORT_EMAIL environment variable; renders nothing if it is unset.
export default function SupportLink() {
  const email = process.env.SUPPORT_EMAIL?.trim();
  if (!email) return null;

  return (
    <a
      href={`mailto:${email}`}
      title={email}
      className="fixed right-4 bottom-4 text-xs text-black/50 underline underline-offset-4 hover:text-black dark:text-white/50 dark:hover:text-white"
    >
      Support
    </a>
  );
}
