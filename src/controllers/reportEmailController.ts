import { Request, Response } from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generateDeveloperPDF } from "../utils/generateDeveloperPdf";
import { generateEndUserPDF } from "../utils/generateEnduserPdf";

dotenv.config();

// -------------------------------
// Interfaces (for strong typing)
// -------------------------------
interface IssueSummary {
  title: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  whyItMatters: string;
  whatToFix: string;
  examples: {
    element: string;
    snippet: string;
    problem: string;
  }[];
  resources: string[];
}

interface PageSummary {
  url: string;
  summary: {
    critical: IssueSummary[];
    serious: IssueSummary[];
    moderate: IssueSummary[];
    minor: IssueSummary[];
  };
}

type SummarizedReport = PageSummary[];

interface Summary {
  score: number;
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  null: number;
}

interface ScannedWebsite {
  id: string;
  url: string;
  date: string;
}

// -------------------------------
// Controller: send accessibility report via email
// -------------------------------
export const sendAccessibilityReport = async (req: Request, res: Response) => {
  try {
    const { email, summarizedReport, summary, scannedWebsite, audience } = req.body as {
      email: string;
      summarizedReport: SummarizedReport;
      summary: Summary;
      scannedWebsite: ScannedWebsite;
      audience: "developer" | "enduser";
    };

    // Generate correct PDF
    const pdfBuffer =
      audience === "developer"
        ? await generateDeveloperPDF(summarizedReport, summary, scannedWebsite)
        : await generateEndUserPDF(summarizedReport, summary, scannedWebsite);

    // Setup Nodemailer transport (Hostinger SMTP)
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const subject =
      audience === "developer"
        ? "Developer Accessibility Report"
        : "End User Accessibility Summary";

    const filename =
      audience === "developer"
        ? "Developer-Accessibility-Report.pdf"
        : "EndUser-Accessibility-Report.pdf";

    // Send email with attachment
    await transporter.sendMail({
      from: `"Accessibility Report" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text:
        audience === "developer"
          ? "Please find the attached detailed Developer Accessibility Report."
          : "Please find the attached End User Accessibility Summary.",
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    });

    res.json({
      success: true,
      message: "Report sent successfully via Hostinger SMTP",
    });
  } catch (error) {
    console.error("Email sending failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send report",
    });
  }
};
