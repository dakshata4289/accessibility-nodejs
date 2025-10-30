import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { generateDeveloperPDF } from "../utils/generateDeveloperPdf";
import { generateEndUserPDF } from "../utils/generateEnduserPdf";

// Interfaces for the direct data structure from frontend
interface Issue {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  description: string;
  help: string;
  examples: { element: string; snippet: string; problem: string }[];
  resources: string[];
}

interface PageSummary {
  url: string;
  issues: Issue[];
}

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

// Interfaces for PDF generator (what your existing PDF functions expect)
interface IssueSummary {
  title: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  whyItMatters: string;
  whatToFix: string;
  examples: { element: string; snippet: string; problem: string }[];
  resources: string[];
}

interface MappedPageSummary {
  url: string;
  summary: {
    critical: IssueSummary[];
    serious: IssueSummary[];
    moderate: IssueSummary[];
    minor: IssueSummary[];
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Maps direct data from frontend to PDF generator format
 */
const mapDataToPdfFormat = (
  summarizedReport: PageSummary[],
  summary: Summary,
  scannedWebsite: ScannedWebsite
): {
  mappedReport: MappedPageSummary[];
  mappedSummary: Summary;
  mappedWebsite: ScannedWebsite;
} => {
  console.log("=== STARTING DATA MAPPING ===");
  console.log(`Mapping ${summarizedReport.length} pages`);
  
  const mappedReport: MappedPageSummary[] = summarizedReport.map((page, pageIndex) => {
    console.log(`Mapping page ${pageIndex + 1}: ${page.url}`);
    console.log(`  Found ${page.issues.length} issues`);

    // Initialize empty arrays for each impact level
    const critical: IssueSummary[] = [];
    const serious: IssueSummary[] = [];
    const moderate: IssueSummary[] = [];
    const minor: IssueSummary[] = [];

    // Map each issue to the expected structure
    page.issues.forEach((issue, issueIndex) => {
      console.log(`  Processing issue ${issueIndex + 1}: ${issue.id} (${issue.impact})`);
      
      const mappedIssue: IssueSummary = {
        title: issue.description,
        impact: issue.impact,
        whyItMatters: issue.help,
        whatToFix: getWhatToFix(issue),
        examples: issue.examples || [],
        resources: issue.resources || []
      };

      // Add to the appropriate impact array
      switch (issue.impact) {
        case 'critical':
          critical.push(mappedIssue);
          console.log(`    -> Added to CRITICAL`);
          break;
        case 'serious':
          serious.push(mappedIssue);
          console.log(`    -> Added to SERIOUS`);
          break;
        case 'moderate':
          moderate.push(mappedIssue);
          console.log(`    -> Added to MODERATE`);
          break;
        case 'minor':
          minor.push(mappedIssue);
          console.log(`    -> Added to MINOR`);
          break;
        default:
          console.warn(`    -> Unknown impact level: ${issue.impact}`);
      }
    });

    const mappedPage = {
      url: page.url,
      summary: {
        critical,
        serious,
        moderate,
        minor
      }
    };

    console.log(`  Page mapping result:`, {
      critical: critical.length,
      serious: serious.length,
      moderate: moderate.length,
      minor: minor.length
    });

    return mappedPage;
  });

  console.log("=== DATA MAPPING COMPLETED ===");
  console.log(`Total pages mapped: ${mappedReport.length}`);
  
  // Log the structure of the first mapped page for verification
  if (mappedReport.length > 0) {
    const firstPage = mappedReport[0];
    console.log("First mapped page structure:", {
      url: firstPage.url,
      summary: {
        critical: firstPage.summary.critical.length,
        serious: firstPage.summary.serious.length,
        moderate: firstPage.summary.moderate.length,
        minor: firstPage.summary.minor.length
      }
    });
    
    if (firstPage.summary.critical.length > 0) {
      console.log("First critical issue:", firstPage.summary.critical[0]);
    }
    if (firstPage.summary.serious.length > 0) {
      console.log("First serious issue:", firstPage.summary.serious[0]);
    }
  }

  return {
    mappedReport,
    mappedSummary: summary,
    mappedWebsite: scannedWebsite
  };
};

/**
 * Generates specific "what to fix" guidance for each issue type
 */
const getWhatToFix = (issue: Issue): string => {
  const baseGuidance = issue.help;
  
  // Add specific guidance based on issue type
  switch (issue.id) {
    case 'color-contrast':
      return `${baseGuidance}. Use color contrast checking tools to ensure text meets WCAG 2 AA minimum contrast ratio of 4.5:1 for normal text. Check the specific contrast ratios mentioned in the examples and adjust colors accordingly.`;
    
    case 'link-name':
      return `${baseGuidance}. Add descriptive text content, aria-label, or title attribute to all links. Ensure all social media links, navigation elements, and icon buttons have proper accessible labels.`;
    
    case 'landmark-main-is-top-level':
      return `${baseGuidance}. Ensure the main landmark is not nested inside other landmarks. Place <main> directly in the body element, not within other landmarks like header, nav, or aside.`;
    
    case 'landmark-no-duplicate-main':
      return `${baseGuidance}. Remove duplicate main landmarks and ensure only one main landmark per page. Check for multiple <main> elements and remove duplicates.`;
    
    case 'landmark-unique':
      return `${baseGuidance}. Add unique aria-label or aria-labelledby attributes to distinguish landmarks. This helps screen reader users understand the purpose of each landmark.`;
    
    case 'page-has-heading-one':
      return `${baseGuidance}. Add a h1 heading to establish the primary purpose of the page. Ensure there is exactly one h1 that describes the main content.`;
    
    case 'nested-interactive':
      return `${baseGuidance}. Remove nested interactive elements and ensure each control is independently focusable. Avoid placing buttons inside buttons or links inside links.`;
    
    case 'aria-dialog-name':
      return `${baseGuidance}. Add an accessible name to dialog elements using aria-label or aria-labelledby. This helps screen reader users understand the purpose of modal dialogs.`;
    
    case 'landmark-one-main':
      return `${baseGuidance}. Add a main landmark to contain the primary content of the page. Wrap the main content area in a <main> element.`;
    
    case 'region':
      return `${baseGuidance}. Ensure all page content is contained within appropriate landmarks (header, main, footer, nav, etc.). Use semantic HTML elements to structure the page.`;
    
    case 'presentation-role-conflict':
      return `${baseGuidance}. Ensure elements marked as presentational do not have global ARIA attributes or tabindex. Remove conflicting attributes from decorative elements.`;
    
    default:
      return `${baseGuidance}. Review the specific examples provided for detailed implementation guidance. Follow WCAG 2.1 guidelines for resolution.`;
  }
};

/**
 * Generates comprehensive email text with issue summary
 */
const generateEmailText = (summary: Summary, audience: "developer" | "enduser", websiteUrl: string): string => {
  const totalIssues = summary.totalIssues;
  const score = summary.score;
  
  if (audience === "developer") {
    return `
Accessibility Scan Report - Developer Version

Website: ${websiteUrl}
Overall Score: ${score}%
Total Issues Found: ${totalIssues}

Breakdown by Severity:
- Critical Issues: ${summary.critical}
- Serious Issues: ${summary.serious} 
- Moderate Issues: ${summary.moderate}
- Minor Issues: ${summary.minor}

The attached PDF contains detailed technical information, code examples, and step-by-step fixes for all identified issues.

Priority Recommendations:
1. Address all CRITICAL and SERIOUS issues first
2. Fix color contrast issues for better readability
3. Add proper labels to all interactive elements
4. Ensure proper document structure and landmarks

Best regards,
Accessibility Scanner Team
    `.trim();
  } else {
    return `
Accessibility Summary Report

Website: ${websiteUrl}
Overall Accessibility Score: ${score}%

We found ${totalIssues} accessibility considerations for your website. 

Key Areas for Improvement:
${summary.critical > 0 ? `• ${summary.critical} high-priority items needing immediate attention` : ''}
${summary.serious > 0 ? `• ${summary.serious} important improvements for better user experience` : ''}
${summary.moderate > 0 ? `• ${summary.moderate} recommendations for enhanced accessibility` : ''}

For detailed technical fixes, please share this report with your development team.

Best regards,
Accessibility Scanner Team
    `.trim();
  }
};

/**
 * Validates the request data structure
 */
const validateRequestData = (
  email: string,
  summarizedReport: any,
  summary: any,
  scannedWebsite: any,
  audience: string
): string | null => {
  if (!email) return "Email is required";
  if (!summarizedReport) return "Summarized report data is required";
  if (!summary) return "Summary data is required";
  if (!scannedWebsite) return "Scanned website data is required";
  if (!audience) return "Audience type is required";
  if (audience !== "developer" && audience !== "enduser") return "Audience must be 'developer' or 'enduser'";
  
  if (!Array.isArray(summarizedReport)) return "Summarized report must be an array";
  
  // Validate each page in summarizedReport
  for (let i = 0; i < summarizedReport.length; i++) {
    const page = summarizedReport[i];
    if (!page.url) return `Page ${i + 1} is missing URL`;
    if (!Array.isArray(page.issues)) return `Page ${i + 1} issues must be an array`;
    
    // Validate each issue
    for (let j = 0; j < page.issues.length; j++) {
      const issue = page.issues[j];
      if (!issue.id) return `Page ${i + 1}, Issue ${j + 1} is missing ID`;
      if (!issue.impact) return `Page ${i + 1}, Issue ${j + 1} is missing impact level`;
      if (!issue.description) return `Page ${i + 1}, Issue ${j + 1} is missing description`;
      if (!issue.help) return `Page ${i + 1}, Issue ${j + 1} is missing help text`;
    }
  }
  
  return null;
};

// ==================== MAIN CONTROLLER ====================

export const sendReport = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("=== EMAIL REQUEST RECEIVED ===");
    console.log("Request body keys:", Object.keys(req.body));
    
    const {
      email,
      summarizedReport,  // Direct data from frontend with issues arrays
      summary,           // Direct data from frontend
      scannedWebsite,    // Direct data from frontend
      audience,
    }: {
      email: string;
      summarizedReport: PageSummary[];
      summary: Summary;
      scannedWebsite: ScannedWebsite;
      audience: "developer" | "enduser";
    } = req.body;

    console.log("Email:", email);
    console.log("Audience:", audience);
    console.log("Scanned website:", scannedWebsite?.url);
    console.log("Total pages:", summarizedReport?.length);
    console.log("Total issues:", summary?.totalIssues);
    console.log("Score:", summary?.score);

    // Log first page structure for debugging
    if (summarizedReport?.[0]) {
      const firstPage = summarizedReport[0];
      console.log("First page structure:", {
        url: firstPage.url,
        issuesCount: firstPage.issues?.length,
        firstIssue: firstPage.issues?.[0] ? {
          id: firstPage.issues[0].id,
          impact: firstPage.issues[0].impact,
          description: firstPage.issues[0].description?.substring(0, 50) + '...'
        } : 'no issues'
      });
    }

    // Validate request data
    const validationError = validateRequestData(email, summarizedReport, summary, scannedWebsite, audience);
    if (validationError) {
      console.error("Validation error:", validationError);
      res.status(400).json({ 
        success: false, 
        error: validationError 
      });
      return;
    }

    // Map the data to the format expected by PDF generators
    const { mappedReport, mappedSummary, mappedWebsite } = mapDataToPdfFormat(
      summarizedReport, 
      summary, 
      scannedWebsite
    );

    console.log(`✅ Mapped ${mappedReport.length} pages for PDF generation`);

    // Generate PDF based on audience
    const pdfBuffer =
      audience === "developer"
        ? await generateDeveloperPDF(mappedReport, mappedSummary, mappedWebsite)
        : await generateEndUserPDF(mappedReport, mappedSummary, mappedWebsite);

    console.log("✅ PDF generated successfully, size:", pdfBuffer.length, "bytes");

    // Configure Hostinger email transporter
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
        ? `Developer Accessibility Report - ${scannedWebsite.url}`
        : `Accessibility Summary - ${scannedWebsite.url}`;

    const filename =
      audience === "developer"
        ? `Developer-Accessibility-Report-${scannedWebsite.id}.pdf`
        : `Accessibility-Summary-${scannedWebsite.id}.pdf`;

    const emailText = generateEmailText(summary, audience, scannedWebsite.url);

    console.log("Sending email to:", email);
    console.log("Subject:", subject);
    console.log("Filename:", filename);

    // Verify SMTP configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials not configured. Please check EMAIL_USER and EMAIL_PASS environment variables.");
    }

    await transporter.sendMail({
      from: `"Accessibility Scanner" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: emailText,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        },
      ],
    });

    console.log("✅ Email sent successfully to:", email);

    res.json({ 
      success: true, 
      message: "Report sent successfully via Hostinger SMTP",
      data: {
        emailSentTo: email,
        audience,
        website: scannedWebsite.url,
        totalIssues: summary.totalIssues,
        score: summary.score,
        criticalIssues: summary.critical,
        seriousIssues: summary.serious,
        moderateIssues: summary.moderate,
        minorIssues: summary.minor,
        pagesScanned: summarizedReport.length,
        reportId: scannedWebsite.id
      }
    });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    
    let errorMessage = "Failed to send report";
    if (error instanceof Error) {
      if (error.message.includes("Invalid login")) {
        errorMessage = "Email authentication failed - check SMTP credentials";
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = "SMTP server not found - check host configuration";
      } else if (error.message.includes("credentials")) {
        errorMessage = "Email credentials not configured properly";
      } else {
        errorMessage = error.message;
      }
    }

    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};