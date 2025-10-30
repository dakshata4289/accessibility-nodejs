import ScannedWebsites from "../models/scannedWebsitesModel";
import Reports from "../models/reportsModel";
import ReportStats from "../models/reportStatsModel";
import User from "../models/userModel";
import { runAccessibilityScan } from "../utils/accessibilityTest";
import { decodeAxeResults } from "../utils/decodeAxeResult";
import { summarizeReport } from "../utils/summarizeReport";

type ImpactLevel = "critical" | "serious" | "moderate" | "minor" | "null";

function getChromePath(): string {
  if (process.platform === "win32") return "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
  if (process.platform === "darwin") return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  return "/usr/bin/google-chrome";
}

export const performWebsiteScan = async (url: string, userEmail: string) => {
  console.log("🚀 Starting website scan service for:", url, "User:", userEmail);

  const dbUser = await User.findOne({ email: userEmail.trim() });
  if (!dbUser) throw new Error("User not found");

  const crawlResults = await runAccessibilityScan({
    startUrl: url,
    maxDepth: 2,
    maxScans: 10,
    concurrency: 3,
    puppeteerOptions: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.CHROME_PATH || getChromePath(),
    },
  });

  if (!crawlResults?.length) {
    const failedWebsite = await new ScannedWebsites({ user: dbUser._id, url, status: "failed" }).save();
    await new Reports({ webId: failedWebsite._id, url, status: "failed" }).save();
    return { success: false, message: "No scan results. Website may block headless browsers." };
  }

  const newScannedWebsite = await new ScannedWebsites({
    user: dbUser._id,
    url,
    status: "success",
  }).save();

  const issueCounts: Record<ImpactLevel, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    null: 0,
  };
  let totalIssues = 0;

  const pageDataForAI = crawlResults.map(({ url: pageUrl, result }: any) => {
    const decoded = decodeAxeResults(result, pageUrl);
    result.violations.forEach((v: any) => {
      const impact = (v.impact ?? "null") as ImpactLevel;
      issueCounts[impact] += v.nodes.length;
      totalIssues += v.nodes.length;
    });

    return {
      url: pageUrl,
      issues: decoded.map((issue: any) => ({
        id: issue.id,
        impact: issue.impact,
        description: issue.description,
        help: issue.help,
        examples: issue.nodes.map((n: any) => ({
          element: n.html,
          snippet: n.html,
          problem: n.failureSummary || "",
        })),
        resources: [issue.helpUrl],
      })),
    };
  });

  console.log("🧠 Generating AI summary...");
  const aiSummary = await summarizeReport(pageDataForAI);

  for (const page of aiSummary.pages) {
    await new Reports({
      webId: newScannedWebsite._id,
      url: page.url,
      status: "success",
      summary: page.issues,
    }).save();
  }

  const weights: Record<ImpactLevel, number> = { critical: 5, serious: 3, moderate: 2, minor: 1, null: 0 };
  const totalPenalty = Object.entries(issueCounts).reduce(
    (acc, [impact, count]) => acc + count * weights[impact as ImpactLevel],
    0
  );

  const totalAudits = totalIssues + 10;
  const weightedScore =
    totalAudits === 0
      ? 100
      : Math.max(0, Math.round((100 - (totalPenalty / (totalAudits * 5)) * 100) * 10) / 10);

  await new ReportStats({
    webId: newScannedWebsite._id,
    totalIssues,
    ...issueCounts,
    score: weightedScore,
  }).save();

  console.log(`✅ Scan completed for ${url} with score ${weightedScore}`);

  return {
    success: true,
    message: "Scan completed & summaries saved",
    scannedWebsite: {
      id: newScannedWebsite._id.toString(),
      url: newScannedWebsite.url,
      date: newScannedWebsite.createdAt.toISOString(),
    },
    summarizedReport: aiSummary.pages,
    summary: {
      totalIssues,
      ...issueCounts,
      score: weightedScore,
    },
  };
};
