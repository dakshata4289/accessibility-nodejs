import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScannedWebsite extends Document {
  _id: mongoose.Types.ObjectId; // ✅ explicitly define _id to fix "unknown" issue
  user: mongoose.Types.ObjectId;
  url: string;
  status: "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const scannedWebsiteSchema = new Schema<IScannedWebsite>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    url: { type: String, required: true },
    status: { type: String, enum: ["success", "failed"], default: "success" },
  },
  { timestamps: true }
);

const ScannedWebsites: Model<IScannedWebsite> =
  mongoose.models.ScannedWebsites ||
  mongoose.model<IScannedWebsite>("ScannedWebsites", scannedWebsiteSchema);

export default ScannedWebsites;
