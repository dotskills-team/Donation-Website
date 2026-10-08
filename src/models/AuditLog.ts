import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IAuditLog {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const schema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true },
    entityId: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> = (models.AuditLog as Model<IAuditLog>) ?? model<IAuditLog>("AuditLog", schema);
