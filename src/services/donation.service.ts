import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { HttpError } from "@/lib/errors";
import { publish } from "@/lib/realtime";
import { Donation, type IDonation } from "@/models/Donation";
import { DonationRequest } from "@/models/DonationRequest";
import { User } from "@/models/User";
import { getActiveCampaign } from "@/services/campaign.service";
import { upsertDonor } from "@/services/donor.service";
import { recordAudit } from "@/services/audit.service";
import { donationMatch, rangeBounds } from "@/services/filters";
import type { DonationCreateInput, DonationQuery, DonationUpdateInput } from "@/lib/validation";
import type { DonationRow, Paginated, SessionUser } from "@/types";

async function moderatorNames(ids: Types.ObjectId[]) {
  const users = await User.find({ _id: { $in: ids } }).select("name").lean<{ _id: Types.ObjectId; name: string }[]>();
  return new Map(users.map((u) => [String(u._id), u.name]));
}

function toRow(d: IDonation, names: Map<string, string>): DonationRow {
  return {
    id: String(d._id),
    donorName: d.donorName,
    donorMobile: d.donorMobile,
    amount: d.amount,
    collectionMethod: d.collectionMethod,
    transactionId: d.transactionId,
    moderator: names.has(String(d.moderatorId)) ? { id: String(d.moderatorId), name: names.get(String(d.moderatorId))! } : null,
    donationDate: d.donationDate.toISOString(),
    status: d.status,
    note: d.note,
    source: d.source,
    anonymous: d.anonymous,
    cancelReason: d.cancelReason,
  };
}

async function rowFor(d: IDonation) {
  return toRow(d, await moderatorNames([d.moderatorId]));
}

export async function createDonation(input: DonationCreateInput, actor: SessionUser) {
  await connectDB();
  if (input.clientKey) {
    const existing = await Donation.findOne({ clientKey: input.clientKey }).lean<IDonation | null>();
    if (existing) return rowFor(existing); // double submit: return the original record
  }
  const campaign = await getActiveCampaign();
  if (!campaign) throw new HttpError(409, "There is no active campaign. Ask an admin to activate one.");

  const donor = await upsertDonor({ name: input.donorName, mobile: input.donorMobile, email: input.donorEmail });
  let doc;
  try {
    doc = await Donation.create({
      campaignId: campaign._id,
      donorId: donor._id,
      moderatorId: actor.id,
      amount: input.amount,
      collectionMethod: input.collectionMethod,
      transactionId: input.transactionId,
      source: input.requestId ? "PUBLIC" : "MODERATOR",
      status: "CONFIRMED",
      note: input.note,
      donationDate: input.donationDate ?? new Date(),
      donorName: input.donorName,
      donorMobile: input.donorMobile,
      anonymous: input.anonymous,
      clientKey: input.clientKey,
      requestId: input.requestId,
    });
  } catch (e) {
    if ((e as { code?: number }).code === 11000 && input.clientKey) {
      const existing = await Donation.findOne({ clientKey: input.clientKey }).lean<IDonation | null>();
      if (existing) return rowFor(existing);
    }
    throw e;
  }

  if (input.requestId) {
    await DonationRequest.updateOne({ _id: input.requestId, status: "PENDING" }, { status: "CONVERTED", convertedDonationId: doc._id });
  }
  await recordAudit({
    userId: actor.id,
    action: "CREATE_DONATION",
    entity: "Donation",
    entityId: String(doc._id),
    metadata: { amount: doc.amount, method: doc.collectionMethod, donorMobile: doc.donorMobile },
  });
  publish("donation.created");
  return rowFor(doc.toObject());
}

export async function listDonations(q: DonationQuery, actor: SessionUser): Promise<Paginated<DonationRow>> {
  await connectDB();
  const { start, end } = rangeBounds(q.from || q.to ? "custom" : "all", q.from, q.to);
  const match = donationMatch({
    // Moderators are always forced to their own records, regardless of query params.
    moderatorId: actor.role === "MODERATOR" ? actor.id : q.moderatorId,
    method: q.method,
    status: q.status,
    start,
    end,
    min: q.min,
    max: q.max,
    q: q.q,
  });
  const [docs, total] = await Promise.all([
    Donation.find(match)
      .sort({ donationDate: -1, _id: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean<IDonation[]>(),
    Donation.countDocuments(match),
  ]);
  const names = await moderatorNames([...new Set(docs.map((d) => String(d.moderatorId)))].map((i) => new Types.ObjectId(i)));
  return { items: docs.map((d) => toRow(d, names)), total, page: q.page, limit: q.limit, pages: Math.max(1, Math.ceil(total / q.limit)) };
}

export async function updateDonation(id: string, input: DonationUpdateInput, actor: SessionUser) {
  await connectDB();
  const d = await Donation.findById(id);
  if (!d) throw new HttpError(404, "Donation not found");
  if (actor.role === "MODERATOR" && String(d.moderatorId) !== actor.id) {
    throw new HttpError(403, "You can only edit your own donations");
  }
  if (d.status !== "CONFIRMED") throw new HttpError(409, "Cancelled donations cannot be edited");

  const before = { amount: d.amount, collectionMethod: d.collectionMethod, transactionId: d.transactionId, note: d.note };
  const changes = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  d.set(changes);
  await d.save();
  await recordAudit({ userId: actor.id, action: "UPDATE_DONATION", entity: "Donation", entityId: id, metadata: { before, after: changes } });
  publish("donation.updated");
  return rowFor(d.toObject());
}

export async function cancelDonation(id: string, reason: string | undefined, actor: SessionUser) {
  await connectDB();
  const d = await Donation.findOneAndUpdate(
    { _id: id, status: "CONFIRMED" },
    { status: "CANCELLED", cancelledAt: new Date(), cancelledBy: actor.id, cancelReason: reason },
    { new: true },
  );
  if (!d) {
    const exists = await Donation.exists({ _id: id });
    throw new HttpError(exists ? 409 : 404, exists ? "This donation is already cancelled" : "Donation not found");
  }
  await recordAudit({ userId: actor.id, action: "CANCEL_DONATION", entity: "Donation", entityId: id, metadata: { amount: d.amount, reason } });
  publish("donation.cancelled");
  return rowFor(d.toObject());
}

function maskName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${Array.from(parts[parts.length - 1])[0]}.`;
}

/** Public-safe feed: no mobile, email, moderator or note. */
export async function recentPublicDonations(limit = 10) {
  await connectDB();
  const campaign = await getActiveCampaign();
  if (!campaign) return [];
  const docs = await Donation.find({ campaignId: campaign._id, status: "CONFIRMED" })
    .sort({ donationDate: -1, _id: -1 })
    .limit(limit)
    .select("donorName amount anonymous donationDate")
    .lean<Pick<IDonation, "_id" | "donorName" | "amount" | "anonymous" | "donationDate">[]>();
  return docs.map((d) => ({
    id: String(d._id),
    name: d.anonymous ? "Anonymous" : maskName(d.donorName),
    amount: d.amount,
    date: d.donationDate.toISOString(),
  }));
}
