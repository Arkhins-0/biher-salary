export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // On this machine, Node's fetch (used by the Neon HTTP driver) times out
    // trying IPv6 addresses to Neon's pooler host before falling back to
    // IPv4. Forcing IPv4-first DNS resolution avoids that.
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
