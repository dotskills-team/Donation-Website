import { Types } from "mongoose";
import { normalizeMobile } from "@/lib/validation";
import { resolveRange } from "@/lib/dates";
import type { CollectionMethod, DonationStatus, RangeKey } from "@/types";

export interface MatchInput {
  campaignId?: string | Types.ObjectId;
  moderatorId?: string;
  method?: CollectionMethod;
  status?: DonationStatus;
  start?: Date;
  end?: Date;
  min?: number;
  max?: number;
  q?: string;
}

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Builds a query usable in both find() and aggregate() (ids are real ObjectIds). */
export function donationMatch(f: MatchInput) {
  const m: Record<string, unknown> = {};
  if (f.campaignId) m.campaignId = new Types.ObjectId(String(f.campaignId));
  if (f.moderatorId) m.moderatorId = new Types.ObjectId(f.moderatorId);
  if (f.method) m.collectionMethod = f.method;
  if (f.status) m.status = f.status;
  if (f.start || f.end) {
    m.donationDate = { ...(f.start ? { $gte: f.start } : {}), ...(f.end ? { $lt: f.end } : {}) };
  }
  if (f.min !== undefined || f.max !== undefined) {
    m.amount = { ...(f.min !== undefined ? { $gte: f.min } : {}), ...(f.max !== undefined ? { $lte: f.max } : {}) };
  }
  if (f.q) {
    const terms = new Set([f.q, normalizeMobile(f.q)]);
    m.$or = [...terms].flatMap((t) => {
      const rx = new RegExp(escapeRx(t), "i");
      return [{ donorName: rx }, { donorMobile: rx }, { transactionId: rx }];
    });
  }
  return m;
}

export function rangeBounds(range?: RangeKey, from?: string, to?: string) {
  return resolveRange(range, from, to);
}
