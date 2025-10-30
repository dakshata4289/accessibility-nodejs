import mongoose, { Schema, Document } from "mongoose";

export interface IReports extends Document {
  webId: mongoose.Types.ObjectId;
  url: string;
  status: "success" | "failed";
  summary?: any[];
}

const reportsSchema = new Schema<IReports>(
  {
    webId: { type: Schema.Types.ObjectId, ref: "ScannedWebsites", required: true },
    url: { type: String, required: true },
    status: { type: String, enum: ["success", "failed"], default: "success" },
    summary: { type: Array },
  },
  { timestamps: true }
);

export default mongoose.model<IReports>("Reports", reportsSchema);
