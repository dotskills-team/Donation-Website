import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IDonor {
  _id: Types.ObjectId;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDonor>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

export const Donor: Model<IDonor> = (models.Donor as Model<IDonor>) ?? model<IDonor>("Donor", schema);
