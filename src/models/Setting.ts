import { Schema, model, models, type Model } from "mongoose";

export interface ISetting {
  key: string;
  value: Record<string, unknown>;
}

const schema = new Schema<ISetting>(
  { key: { type: String, required: true, unique: true }, value: { type: Schema.Types.Mixed, default: {} } },
  { timestamps: true },
);

export const Setting: Model<ISetting> = (models.Setting as Model<ISetting>) ?? model<ISetting>("Setting", schema);
