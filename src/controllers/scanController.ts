import { Request, Response } from "express";
import { performWebsiteScan } from "../services/scanService";

export const scanWebsite = async (req: Request, res: Response) => {
  try {
    const { url, user } = req.body;

    if (!url || typeof url !== "string" || url.trim() === "") {
      return res.status(400).json({ success: false, message: "URL is required" });
    }

    if (!user || typeof user !== "string" || user.trim() === "") {
      return res.status(400).json({ success: false, message: "User email is required" });
    }

    const result = await performWebsiteScan(url, user);
    return res.status(200).json(result);

  } catch (error: any) {
    console.error("Scan Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
