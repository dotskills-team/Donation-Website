import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { HttpError } from "@/lib/errors";
import { hasPermission, type Permission } from "@/lib/permissions";
import { User } from "@/models/User";
import type { SessionUser } from "@/types";

export const COOKIE = "dcms_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ characters)");
  return new TextEncoder().encode(s);
}

export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

export async function startSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Resolves the user from the signed cookie, then re-checks the DB: role and status are never taken from the client. */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    await connectDB();
    const u = await User.findById(payload.sub).select("name email role status").lean();
    if (!u || u.status !== "ACTIVE") return null;
    return { id: String(u._id), name: u.name, email: u.email, role: u.role };
  } catch {
    return null;
  }
}

export async function requirePermission(perm: Permission): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Please sign in");
  if (!hasPermission(s.role, perm)) throw new HttpError(403, "You do not have permission to do this");
  return s;
}
