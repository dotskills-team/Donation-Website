import { Schema, model, models, type Model, type Types } from "mongoose";
import type { CampaignStatus } from "@/types";

export interface ICampaign {
  _id: Types.ObjectId;
  title: string;
  description: string;
  targetAmount: number;
  status: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICampaign>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 4000 },
    targetAmount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["DRAFT", "ACTIVE", "COMPLETED", "CLOSED"], default: "DRAFT", index: true },
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true },
);

export const Campaign: Model<ICampaign> = (models.Campaign as Model<ICampaign>) ?? model<ICampaign>("Campaign", schema);
