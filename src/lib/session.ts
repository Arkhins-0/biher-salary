import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export interface SessionData {
  isLoggedIn: boolean;
  userId?: number;
  role?: "admin" | "dev";
}

function getSessionOptions(): SessionOptions {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error(
      "SESSION_SECRET is not set or is too short. It must be at least 32 characters. Add it to your .env file.",
    );
  }
  return {
    password: process.env.SESSION_SECRET,
    cookieName: "biher_salary_admin_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}
