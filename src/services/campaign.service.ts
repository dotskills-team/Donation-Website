import { connectDB } from "@/lib/mongodb";
import { HttpError } from "@/lib/errors";
import { Campaign, type ICampaign } from "@/models/Campaign";
import { recordAudit } from "@/services/audit.service";
import { publish } from "@/lib/realtime";
import type { CampaignDTO, SessionUser } from "@/types";

export function toCampaignDTO(c: ICampaign): CampaignDTO {
  return {
    id: String(c._id),
    title: c.title,
    description: c.description,
    targetAmount: c.targetAmount,
    status: c.status,
    startDate: c.startDate?.toISOString(),
    endDate: c.endDate?.toISOString(),
  };
}

export async function getActiveCampaign() {
  await connectDB();
  return Campaign.findOne({ status: "ACTIVE" }).sort({ createdAt: -1 }).lean<ICampaign | null>();
}

export async function listCampaigns() {
  await connectDB();
  const items = await Campaign.find().sort({ createdAt: -1 }).lean<ICampaign[]>();
  return items.map(toCampaignDTO);
}

type CampaignInput = {
  title?: string;
  description?: string;
  targetAmount?: number;
  status?: ICampaign["status"];
  startDate?: Date;
  endDate?: Date;
};

async function assertSingleActive(status: string | undefined, selfId?: string) {
  if (status !== "ACTIVE") return;
  const other = await Campaign.findOne({ status: "ACTIVE", ...(selfId ? { _id: { $ne: selfId } } : {}) }).lean();
  if (other) {
    throw new HttpError(409, "Another campaign is already active. Complete or close it first.", {
      status: "Only one campaign can be active at a time",
    });
  }
}

function assertDates(start?: Date, end?: Date) {
  if (start && end && end < start) throw new HttpError(400, "End date must be after the start date", { endDate: "Must be after the start date" });
}

export async function createCampaign(input: CampaignInput, actor: SessionUser) {
  await connectDB();
  await assertSingleActive(input.status);
  assertDates(input.startDate, input.endDate);
  const c = await Campaign.create(input);
  await recordAudit({ userId: actor.id, action: "CREATE_CAMPAIGN", entity: "Campaign", entityId: String(c._id), metadata: { title: c.title, status: c.status } });
  publish("campaign.changed");
  return toCampaignDTO(c.toObject());
}

export async function updateCampaign(id: string, input: CampaignInput, actor: SessionUser) {
  await connectDB();
  const c = await Campaign.findById(id);
  if (!c) throw new HttpError(404, "Campaign not found");
  await assertSingleActive(input.status, id);
  assertDates(input.startDate ?? c.startDate, input.endDate ?? c.endDate);
  const before = { title: c.title, targetAmount: c.targetAmount, status: c.status };
  c.set(Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)));
  await c.save();
  await recordAudit({ userId: actor.id, action: "UPDATE_CAMPAIGN", entity: "Campaign", entityId: id, metadata: { before, after: input } });
  publish("campaign.changed");
  return toCampaignDTO(c.toObject());
}
