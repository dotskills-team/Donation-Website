import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { startOfDhakaDay } from "@/lib/dates";
import { Donation } from "@/models/Donation";
import { DonationRequest } from "@/models/DonationRequest";
import { User } from "@/models/User";
import { getActiveCampaign } from "@/services/campaign.service";
import { donationMatch } from "@/services/filters";
import { METHODS } from "@/lib/format";
import type { CampaignSummary, MethodRow, PerformanceRow, Stats } from "@/types";

type Match = Record<string, unknown>;
const DAY = 86_400_000;

export async function statsFor(match: Match): Promise<Stats> {
  await connectDB();
  const [r] = await Donation.aggregate<Stats>([
    { $match: match },
    { $group: { _id: "$donorId", amt: { $sum: "$amount" }, cnt: { $sum: 1 } } },
    { $group: { _id: null, total: { $sum: "$amt" }, count: { $sum: "$cnt" }, donors: { $sum: 1 } } },
  ]);
  return { total: r?.total ?? 0, count: r?.count ?? 0, donors: r?.donors ?? 0 };
}

function todayBounds() {
  const start = startOfDhakaDay();
  return { start, end: new Date(start.getTime() + DAY) };
}

/** All totals come from CONFIRMED donations in MongoDB; the client can never set them. */
export async function campaignSummary(campaignId: string | Types.ObjectId, target: number): Promise<CampaignSummary> {
  const [all, today] = await Promise.all([
    statsFor(donationMatch({ campaignId, status: "CONFIRMED" })),
    statsFor(donationMatch({ campaignId, status: "CONFIRMED", ...todayBounds() })),
  ]);
  return {
    ...all,
    target,
    remaining: Math.max(0, target - all.total),
    percent: target > 0 ? Math.round((all.total / target) * 1000) / 10 : 0,
    todayTotal: today.total,
    todayCount: today.count,
  };
}

export async function publicOverview() {
  const c = await getActiveCampaign();
  if (!c) return null;
  const summary = await campaignSummary(c._id, c.targetAmount);
  return {
    campaign: {
      id: String(c._id),
      title: c.title,
      description: c.description,
      targetAmount: c.targetAmount,
      status: c.status,
      startDate: c.startDate?.toISOString(),
      endDate: c.endDate?.toISOString(),
    },
    summary,
  };
}

export async function adminKpis() {
  await connectDB();
  const c = await getActiveCampaign();
  const scope = c ? { campaignId: c._id } : {};
  const [all, today, activeModerators, pendingRequests] = await Promise.all([
    statsFor(donationMatch({ ...scope, status: "CONFIRMED" })),
    statsFor(donationMatch({ ...scope, status: "CONFIRMED", ...todayBounds() })),
    User.countDocuments({ role: "MODERATOR", status: "ACTIVE" }),
    DonationRequest.countDocuments({ status: "PENDING" }),
  ]);
  return {
    campaignTitle: c?.title ?? null,
    target: c?.targetAmount ?? 0,
    totalCollection: all.total,
    totalDonations: all.count,
    totalDonors: all.donors,
    todayCollection: today.total,
    todayDonations: today.count,
    activeModerators,
    pendingRequests,
  };
}

export async function moderatorStats(userId: string) {
  const c = await getActiveCampaign();
  const scope = c ? { campaignId: c._id } : {};
  const [all, today] = await Promise.all([
    statsFor(donationMatch({ ...scope, moderatorId: userId, status: "CONFIRMED" })),
    statsFor(donationMatch({ ...scope, moderatorId: userId, status: "CONFIRMED", ...todayBounds() })),
  ]);
  return { total: all.total, count: all.count, todayTotal: today.total, todayCount: today.count };
}

/** Ranked by total collected. Active moderators with no donations in range still appear (rank by total, then name). */
export async function performance(match: Match, viewerId?: string, includeIds = false): Promise<PerformanceRow[]> {
  await connectDB();
  const groups = await Donation.aggregate<{ _id: Types.ObjectId; total: number; count: number }>([
    { $match: match },
    { $group: { _id: "$moderatorId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const byId = new Map(groups.map((g) => [String(g._id), g]));
  const filteredToOne = match.moderatorId !== undefined;
  const users = await User.find(
    filteredToOne
      ? { _id: match.moderatorId }
      : { role: "MODERATOR", $or: [{ status: "ACTIVE" }, { _id: { $in: groups.map((g) => g._id) } }] },
  )
    .select("name")
    .lean<{ _id: Types.ObjectId; name: string }[]>();
  const rows = users
    .map((u) => ({
      id: String(u._id),
      name: u.name,
      count: byId.get(String(u._id))?.count ?? 0,
      total: byId.get(String(u._id))?.total ?? 0,
    }))
    .sort((a, b) => b.total - a.total || b.count - a.count || a.name.localeCompare(b.name));
  return rows.map((r, i) => ({
    ...(includeIds ? { id: r.id } : {}),
    rank: i + 1,
    name: r.name,
    count: r.count,
    total: r.total,
    isMe: viewerId === r.id,
  }));
}

export async function methodReport(match: Match): Promise<MethodRow[]> {
  await connectDB();
  const groups = await Donation.aggregate<{ _id: MethodRow["method"]; total: number; count: number }>([
    { $match: match },
    { $group: { _id: "$collectionMethod", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const map = new Map(groups.map((g) => [g._id, g]));
  return METHODS.map((m) => ({ method: m, count: map.get(m)?.count ?? 0, total: map.get(m)?.total ?? 0 }));
}

export async function dailyReport(match: Match) {
  await connectDB();
  const rows = await Donation.aggregate<{ _id: string; total: number; count: number }>([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$donationDate", timezone: "Asia/Dhaka" } },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ date: r._id, count: r.count, total: r.total }));
}
