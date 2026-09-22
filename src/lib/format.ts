// Fixed locale and time zone so this renders identically on the server and
// in the browser, regardless of either environment's local settings —
// important since some callers are Client Components that hydrate.
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return dateTimeFormatter.format(d);
}
