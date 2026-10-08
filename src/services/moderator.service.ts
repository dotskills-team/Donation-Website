import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { HttpError } from "@/lib/errors";
import { hashPassword } from "@/lib/auth";
import { publish } from "@/lib/realtime";
import { User, type IUser } from "@/models/User";
import { Donation } from "@/models/Donation";
import { recordAudit } from "@/services/audit.service";
import type { SessionUser } from "@/types";

const dto = (u: IUser) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  mobile: u.mobile,
  status: u.status,
  createdAt: u.createdAt.toISOString(),
});

function dupEmail(e: unknown): never {
  if ((e as { code?: number }).code === 11000) {
    throw new HttpError(409, "This email is already in use", { email: "This email is already in use" });
  }
  throw e;
}

export async function listModerators() {
  await connectDB();
  const users = await User.find({ role: "MODERATOR" }).sort({ createdAt: -1 }).lean<IUser[]>();
  const stats = await Donation.aggregate<{ _id: Types.ObjectId; total: number; count: number }>([
    { $match: { status: "CONFIRMED", moderatorId: { $in: users.map((u) => u._id) } } },
    { $group: { _id: "$moderatorId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const map = new Map(stats.map((s) => [String(s._id), s]));
  return users.map((u) => ({ ...dto(u), donations: map.get(String(u._id))?.count ?? 0, total: map.get(String(u._id))?.total ?? 0 }));
}

export async function getModerator(id: string) {
  await connectDB();
  const u = await User.findOne({ _id: id, role: "MODERATOR" }).lean<IUser | null>();
  if (!u) throw new HttpError(404, "Moderator not found");
  const [s] = await Donation.aggregate<{ total: number; count: number }>([
    { $match: { status: "CONFIRMED", moderatorId: u._id } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  return { ...dto(u), donations: s?.count ?? 0, total: s?.total ?? 0 };
}

export async function createModerator(
  input: { name: string; email: string; mobile: string; password: string; status: "ACTIVE" | "INACTIVE" },
  actor: SessionUser,
) {
  await connectDB();
  try {
    const u = await User.create({ ...input, passwordHash: await hashPassword(input.password), role: "MODERATOR" });
    await recordAudit({ userId: actor.id, action: "CREATE_MODERATOR", entity: "User", entityId: String(u._id), metadata: { email: u.email } });
    publish("moderator.changed");
    return dto(u.toObject());
  } catch (e) {
    return dupEmail(e);
  }
}

export async function updateModerator(
  id: string,
  input: { name?: string; email?: string; mobile?: string; status?: "ACTIVE" | "INACTIVE" },
  actor: SessionUser,
) {
  await connectDB();
  const u = await User.findOne({ _id: id, role: "MODERATOR" });
  if (!u) throw new HttpError(404, "Moderator not found");
  const wasStatus = u.status;
  u.set(Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)));
  try {
    await u.save();
  } catch (e) {
    return dupEmail(e);
  }
  const action = input.status === "INACTIVE" && wasStatus === "ACTIVE" ? "DEACTIVATE_MODERATOR" : "UPDATE_MODERATOR";
  await recordAudit({ userId: actor.id, action, entity: "User", entityId: id, metadata: { changes: input } });
  publish("moderator.changed");
  return dto(u.toObject());
}

export async function resetModeratorPassword(id: string, password: string, actor: SessionUser) {
  await connectDB();
  const res = await User.updateOne({ _id: id, role: "MODERATOR" }, { passwordHash: await hashPassword(password) });
  if (!res.matchedCount) throw new HttpError(404, "Moderator not found");
  await recordAudit({ userId: actor.id, action: "RESET_PASSWORD", entity: "User", entityId: id });
}
