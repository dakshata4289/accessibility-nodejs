import mongoose, { Schema, Document } from "mongoose";

export interface IReportStats extends Document {
  webId: mongoose.Types.ObjectId;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  null: number;
  score: number;
}

const reportStatsSchema = new Schema<IReportStats>(
  {
    webId: { type: Schema.Types.ObjectId, ref: "ScannedWebsites", required: true },
    totalIssues: Number,
    critical: Number,
    serious: Number,
    moderate: Number,
    minor: Number,
    null: Number,
    score: Number,
  },
  { timestamps: true }
);

export default mongoose.model<IReportStats>("ReportStats", reportStatsSchema);
