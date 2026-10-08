import { Schema, model, models, type Model, type Types } from "mongoose";
import type { CollectionMethod, DonationStatus } from "@/types";

export interface IDonation {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  donorId: Types.ObjectId;
  moderatorId: Types.ObjectId;
  amount: number;
  collectionMethod: CollectionMethod;
  transactionId?: string;
  source: "PUBLIC" | "MODERATOR";
  status: DonationStatus;
  note?: string;
  donationDate: Date;
  // Snapshots so searching/listing never needs a join and history stays stable.
  donorName: string;
  donorMobile: string;
  anonymous: boolean;
  clientKey?: string; // idempotency key: prevents double submit
  requestId?: Types.ObjectId;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDonation>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    donorId: { type: Schema.Types.ObjectId, ref: "Donor", required: true },
    moderatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    collectionMethod: { type: String, enum: ["CASH", "BKASH", "NAGAD", "BANK", "OTHER"], required: true },
    transactionId: { type: String, trim: true, maxlength: 80 },
    source: { type: String, enum: ["PUBLIC", "MODERATOR"], default: "MODERATOR" },
    status: { type: String, enum: ["CONFIRMED", "CANCELLED"], default: "CONFIRMED" },
    note: { type: String, trim: true, maxlength: 500 },
    donationDate: { type: Date, default: Date.now },
    donorName: { type: String, required: true },
    donorMobile: { type: String, required: true },
    anonymous: { type: Boolean, default: false },
    clientKey: { type: String },
    requestId: { type: Schema.Types.ObjectId, ref: "DonationRequest" },
    cancelledAt: Date,
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelReason: { type: String, maxlength: 300 },
  },
  { timestamps: true },
);

schema.index({ campaignId: 1, status: 1, donationDate: -1 });
schema.index({ moderatorId: 1, status: 1, donationDate: -1 });
schema.index({ donorId: 1, status: 1 });
schema.index({ transactionId: 1 });
schema.index({ clientKey: 1 }, { unique: true, partialFilterExpression: { clientKey: { $type: "string" } } });

export const Donation: Model<IDonation> = (models.Donation as Model<IDonation>) ?? model<IDonation>("Donation", schema);
