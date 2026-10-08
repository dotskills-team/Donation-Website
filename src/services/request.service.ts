import { connectDB } from "@/lib/mongodb";
import { HttpError } from "@/lib/errors";
import { publish } from "@/lib/realtime";
import { DonationRequest, type IDonationRequest } from "@/models/DonationRequest";
import { getActiveCampaign } from "@/services/campaign.service";

export async function createRequest(input: { name: string; mobile: string; amount: number; note?: string }) {
  await connectDB();
  const c = await getActiveCampaign();
  if (!c) throw new HttpError(409, "There is no active campaign right now");
  // Light abuse guard: the same mobile cannot flood the queue.
  const pending = await DonationRequest.countDocuments({ mobile: input.mobile, status: "PENDING" });
  if (pending >= 3) throw new HttpError(429, "You already have pending requests. A moderator will contact you soon.");
  await DonationRequest.create({ ...input, campaignId: c._id });
  publish("request.created");
}

export async function listRequests(status: "PENDING" | "CONVERTED" | "REJECTED" = "PENDING") {
  await connectDB();
  const rows = await DonationRequest.find({ status }).sort({ createdAt: -1 }).limit(100).lean<IDonationRequest[]>();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name,
    mobile: r.mobile,
    amount: r.amount,
    note: r.note ?? "",
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function rejectRequest(id: string) {
  await connectDB();
  const r = await DonationRequest.updateOne({ _id: id, status: "PENDING" }, { status: "REJECTED" });
  if (!r.matchedCount) throw new HttpError(404, "Pending request not found");
  publish("request.updated");
}
