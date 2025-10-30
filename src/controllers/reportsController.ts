import { Request, Response } from "express";
import mongoose from "mongoose";
import Reports from "../models/reportsModel";
import ScannedWebsites from "../models/scannedWebsitesModel";
import ReportStats from "../models/reportStatsModel";

export const getReportById = async (req: Request, res: Response) => {
  console.log("🔍 === REPORTS CONTROLLER STARTED ===");
  console.log("📝 Request parameters:", req.params);

  try {
    const { id } = req.params;
    console.log("🆔 Received ID:", id);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid MongoDB ObjectId");
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const scannedWebsite = await ScannedWebsites.findById(id);
    console.log("🌐 Scanned website found:", !!scannedWebsite);

    if (!scannedWebsite) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    const reports = await Reports.find({ webId: id });
    console.log("📄 Reports found:", reports.length);

    if (!reports.length) {
      return res.status(404).json({
        success: false,
        message: "No reports found",
      });
    }

    const stats = await ReportStats.findOne({ webId: id });
    console.log("📊 Stats found:", !!stats);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "Report stats not found",
      });
    }

    return res.json({
      success: true,
      scannedWebsite: {
        id: scannedWebsite._id.toString(),
        url: scannedWebsite.url,
        date: scannedWebsite.createdAt,
      },
      summary: {
        totalIssues: stats.totalIssues,
        critical: stats.critical,
        serious: stats.serious,
        moderate: stats.moderate,
        minor: stats.minor,
        null: stats.null,
        score: stats.score,
      },
      summarizedReport: reports.map((r) => ({
        url: r.url,
        summary: r.summary,
      })),
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching reports",
    });
  }
};

/**
 * @desc Debug - Get all reports, websites, and stats
 * @route GET /reports/debug/all
 */
export const getAllReportsDebug = async (_req: Request, res: Response) => {
  try {
    const allWebsites = await ScannedWebsites.find().sort({ createdAt: -1 });
    const allReports = await Reports.find();
    const allStats = await ReportStats.find();

    return res.json({
      success: true,
      websites: allWebsites.map((w) => ({
        id: w._id.toString(),
        url: w.url,
        status: w.status,
        createdAt: w.createdAt,
      })),
      reportsCount: allReports.length,
      statsCount: allStats.length,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return res.status(500).json({
      success: false,
      message: "Debug error",
    });
  }
};

/**
 * @desc Debug - Get details for specific website ID
 * @route GET /reports/debug/:id
 */
export const getDebugById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({
        validObjectId: false,
        message: "Invalid MongoDB ObjectId",
      });
    }

    const website = await ScannedWebsites.findById(id);
    const reports = await Reports.find({ webId: id });
    const stats = await ReportStats.findOne({ webId: id });

    return res.json({
      validObjectId: true,
      websiteExists: !!website,
      reportsCount: reports.length,
      statsExists: !!stats,
      website: website
        ? {
            id: website._id.toString(),
            url: website.url,
            status: website.status,
            createdAt: website.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Debug ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Debug ID error",
    });
  }
};
