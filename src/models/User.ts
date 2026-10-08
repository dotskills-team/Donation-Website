import { Schema, model, models, type Model, type Types } from "mongoose";
import type { Role, UserStatus } from "@/types";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "MODERATOR"], required: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true },
);

export const User: Model<IUser> = (models.User as Model<IUser>) ?? model<IUser>("User", schema);
