import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IDonationRequest {
  _id: Types.ObjectId;
  campaignId: Types.ObjectId;
  name: string;
  mobile: string;
  amount: number;
  note?: string;
  status: "PENDING" | "CONVERTED" | "REJECTED";
  convertedDonationId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDonationRequest>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    mobile: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ["PENDING", "CONVERTED", "REJECTED"], default: "PENDING", index: true },
    convertedDonationId: { type: Schema.Types.ObjectId, ref: "Donation" },
  },
  { timestamps: true },
);

export const DonationRequest: Model<IDonationRequest> =
  (models.DonationRequest as Model<IDonationRequest>) ?? model<IDonationRequest>("DonationRequest", schema);
