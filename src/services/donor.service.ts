import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { HttpError } from "@/lib/errors";
import { Donor, type IDonor } from "@/models/Donor";
import { Donation } from "@/models/Donation";
import { normalizeMobile } from "@/lib/validation";

export async function upsertDonor(input: { name: string; mobile: string; email?: string; address?: string }) {
  await connectDB();
  const set: Record<string, string> = { name: input.name };
  if (input.email) set.email = input.email;
  if (input.address) set.address = input.address;
  const run = () => Donor.findOneAndUpdate({ mobile: input.mobile }, { $set: set }, { upsert: true, new: true });
  try {
    return await run();
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return run(); // concurrent insert: retry once
    throw e;
  }
}

export async function findDonorByMobile(raw: string) {
  await connectDB();
  const d = await Donor.findOne({ mobile: normalizeMobile(raw) }).select("name email").lean<Pick<IDonor, "name" | "email"> | null>();
  return d ? { name: d.name, email: d.email ?? "" } : null;
}

export async function listDonors(q: { page: number; limit: number; q?: string }) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q.q) {
    const rx = new RegExp(q.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { mobile: rx }, { email: rx }];
  }
  const [rows, total] = await Promise.all([
    Donor.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean<IDonor[]>(),
    Donor.countDocuments(filter),
  ]);
  const stats = await Donation.aggregate<{ _id: Types.ObjectId; total: number; count: number }>([
    { $match: { donorId: { $in: rows.map((r) => r._id) }, status: "CONFIRMED" } },
    { $group: { _id: "$donorId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const map = new Map(stats.map((s) => [String(s._id), s]));
  return {
    items: rows.map((r) => ({
      id: String(r._id),
      name: r.name,
      mobile: r.mobile,
      email: r.email ?? "",
      address: r.address ?? "",
      donations: map.get(String(r._id))?.count ?? 0,
      total: map.get(String(r._id))?.total ?? 0,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page: q.page,
    limit: q.limit,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  };
}

export async function getDonor(id: string) {
  await connectDB();
  const d = await Donor.findById(id).lean<IDonor | null>();
  if (!d) throw new HttpError(404, "Donor not found");
  const history = await Donation.find({ donorId: d._id }).sort({ donationDate: -1 }).limit(50).lean();
  return {
    id: String(d._id),
    name: d.name,
    mobile: d.mobile,
    email: d.email ?? "",
    address: d.address ?? "",
    donations: history.map((h) => ({
      id: String(h._id),
      amount: h.amount,
      collectionMethod: h.collectionMethod,
      status: h.status,
      donationDate: h.donationDate.toISOString(),
    })),
  };
}
