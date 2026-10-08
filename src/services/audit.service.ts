import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";

export type AuditAction =
  | "LOGIN"
  | "CREATE_DONATION"
  | "UPDATE_DONATION"
  | "CANCEL_DONATION"
  | "CREATE_MODERATOR"
  | "UPDATE_MODERATOR"
  | "DEACTIVATE_MODERATOR"
  | "RESET_PASSWORD"
  | "CREATE_CAMPAIGN"
  | "UPDATE_CAMPAIGN";

export async function recordAudit(e: {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await connectDB();
    await AuditLog.create({
      userId: e.userId ? new Types.ObjectId(e.userId) : undefined,
      action: e.action,
      entity: e.entity,
      entityId: e.entityId,
      metadata: e.metadata,
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}
