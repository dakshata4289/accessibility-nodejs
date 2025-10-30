import PDFDocument from "pdfkit";

// Interface for the mapped data structure
interface IssueSummary {
  title: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  whyItMatters: string;
  whatToFix: string;
  examples: { element: string; snippet: string; problem: string }[];
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

export const generateDeveloperPDF = (
  summarizedReport: PageSummary[],
  summary: Summary,
  scannedWebsite: ScannedWebsite
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('=== PDF GENERATION STARTED ===');
      console.log('Input data structure analysis:');
      console.log('summarizedReport type:', Array.isArray(summarizedReport) ? 'array' : typeof summarizedReport);
      console.log('summarizedReport length:', summarizedReport?.length);
      
      if (summarizedReport?.[0]) {
        const firstItem = summarizedReport[0];
        console.log('First item keys:', Object.keys(firstItem));
        if (firstItem.summary) {
          console.log('Summary structure confirmed');
          console.log('Critical issues:', firstItem.summary.critical?.length || 0);
          console.log('Serious issues:', firstItem.summary.serious?.length || 0);
          console.log('Moderate issues:', firstItem.summary.moderate?.length || 0);
          console.log('Minor issues:', firstItem.summary.minor?.length || 0);
        }
      }

      // Validate inputs
      if (!summarizedReport || !Array.isArray(summarizedReport)) {
        throw new Error("Invalid summarizedReport: must be an array");
      }
      
      if (!summary) {
        throw new Error("Summary data is required");
      }
      
      if (!scannedWebsite) {
        throw new Error("Scanned website data is required");
      }

      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        console.log('=== PDF GENERATION COMPLETED ===');
        resolve(Buffer.concat(chunks));
      });

      // Header
      doc.fontSize(20).text("Developer Accessibility Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Website: ${scannedWebsite.url}`);
      doc.text(`Date: ${new Date(scannedWebsite.date).toLocaleDateString()}`);
      doc.text(`Scan ID: ${scannedWebsite.id}`);
      doc.moveDown();

      // Summary Section
      doc.fontSize(16).text("Executive Summary", { underline: true });
      doc.moveDown(0.5);
      
      // Score with visual indicator
      doc.fontSize(14).fillColor(getScoreColor(summary.score)).text(`Overall Score: ${summary.score}%`);
      doc.fillColor('black');
      
      doc.fontSize(12);
      doc.text(`Total Issues Found: ${summary.totalIssues}`);
      doc.text(`Critical Issues: ${summary.critical}`);
      doc.text(`Serious Issues: ${summary.serious}`);
      doc.text(`Moderate Issues: ${summary.moderate}`);
      doc.text(`Minor Issues: ${summary.minor}`);

      doc.moveDown();

      // Issue Distribution
      doc.fontSize(14).text("Issue Distribution:", { underline: true });
      doc.moveDown(0.3);
      
      const total = summary.critical + summary.serious + summary.moderate + summary.minor;
      if (total > 0) {
        doc.fontSize(10);
        if (summary.critical > 0) {
          doc.fillColor('red').text(`■ Critical: ${summary.critical} (${Math.round((summary.critical / total) * 100)}%)`);
        }
        if (summary.serious > 0) {
          doc.fillColor('orange').text(`■ Serious: ${summary.serious} (${Math.round((summary.serious / total) * 100)}%)`);
        }
        if (summary.moderate > 0) {
          doc.fillColor('blue').text(`■ Moderate: ${summary.moderate} (${Math.round((summary.moderate / total) * 100)}%)`);
        }
        if (summary.minor > 0) {
          doc.fillColor('gray').text(`■ Minor: ${summary.minor} (${Math.round((summary.minor / total) * 100)}%)`);
        }
        doc.fillColor('black');
      }
      
      doc.moveDown();

      // Detailed Findings
      doc.fontSize(16).text("Detailed Findings", { underline: true });
      doc.moveDown(0.5);

      // Get pages with issues - optimized for mapped structure
      const pagesWithIssues = summarizedReport.filter(page => {
        if (!page || !page.summary) return false;
        
        const totalIssues = (page.summary.critical?.length || 0) + 
                           (page.summary.serious?.length || 0) + 
                           (page.summary.moderate?.length || 0) + 
                           (page.summary.minor?.length || 0);
        return totalIssues > 0;
      });

      console.log(`Pages with issues: ${pagesWithIssues.length}`);

      if (pagesWithIssues.length === 0) {
        doc.fontSize(12)
           .fillColor('green')
           .text("No accessibility issues found across all scanned pages! ✓");
        doc.fillColor('black');
      } else {
        pagesWithIssues.forEach((page, pageIndex) => {
          console.log(`Processing page ${pageIndex + 1}: ${page.url}`);
          
          const pageIssueCount = (page.summary.critical?.length || 0) + 
                               (page.summary.serious?.length || 0) + 
                               (page.summary.moderate?.length || 0) + 
                               (page.summary.minor?.length || 0);

          console.log(`Page ${pageIndex + 1} issues:`, {
            critical: page.summary.critical?.length || 0,
            serious: page.summary.serious?.length || 0,
            moderate: page.summary.moderate?.length || 0,
            minor: page.summary.minor?.length || 0
          });

          doc.fontSize(13).text(`${pageIndex + 1}. Page: ${page.url}`);
          doc.fontSize(10).fillColor('gray').text(`   Found ${pageIssueCount} issues on this page`);
          doc.fillColor('black');
          doc.moveDown(0.3);

          // Process each impact level in order of severity
          (['critical', 'serious', 'moderate', 'minor'] as const).forEach(impact => {
            const issues = page.summary[impact];
            if (issues && issues.length > 0) {
              console.log(`  Processing ${impact} issues: ${issues.length}`);
              
              doc.fontSize(11)
                 .fillColor(getImpactColor(impact))
                 .text(`   ${impact.toUpperCase()} ISSUES (${issues.length}):`, { continued: false });
              doc.fillColor('black');
              doc.moveDown(0.2);

              issues.forEach((issue: IssueSummary, issueIndex: number) => {
                doc.fontSize(10).text(`     ${issueIndex + 1}. ${issue.title}`, { indent: 15 });
                
                // Why it matters
                if (issue.whyItMatters) {
                  doc.text(`        Why It Matters: ${issue.whyItMatters}`, { indent: 20 });
                }
                
                // What to fix
                if (issue.whatToFix) {
                  doc.text(`        What To Fix: ${issue.whatToFix}`, { indent: 20 });
                }
                
                // Examples
                if (issue.examples && issue.examples.length > 0) {
                  doc.text(`        Examples (${issue.examples.length} found):`, { indent: 20 });
                  issue.examples.forEach((example, exampleIndex: number) => {
                    if (exampleIndex < 2) { // Limit examples to avoid PDF becoming too large
                      doc.text(`          ${exampleIndex + 1}. Element:`, { indent: 25 });
                      if (example.element) {
                        doc.text(`             ${truncateText(example.element, 70)}`, { indent: 30 });
                      }
                      if (example.problem) {
                        doc.text(`             Problem: ${truncateText(example.problem, 80)}`, { indent: 30 });
                      }
                      doc.moveDown(0.1);
                    }
                  });
                  if (issue.examples.length > 2) {
                    doc.text(`          ... and ${issue.examples.length - 2} more examples`, { indent: 25 });
                  }
                  doc.moveDown(0.1);
                }

                // Resources
                if (issue.resources && issue.resources.length > 0) {
                  doc.text(`        Resources:`, { indent: 20 });
                  issue.resources.forEach((resource: string, resourceIndex: number) => {
                    if (resourceIndex < 2) {
                      doc.text(`          ${resourceIndex + 1}. ${truncateText(resource, 80)}`, { indent: 25 });
                    }
                  });
                }

                doc.moveDown(0.3);
              });
              doc.moveDown(0.2);
            }
          });

          doc.moveDown(0.5);
          
          // Add page break if this isn't the last page and we have more content
          if (pageIndex < pagesWithIssues.length - 1 && pageIssueCount > 3) {
            doc.addPage();
          }
        });
      }

      // Footer with recommendations
      doc.addPage();
      doc.fontSize(16).text("Recommendations & Next Steps", { align: "center", underline: true });
      doc.moveDown();
      
      const recommendations = getRecommendations(summary);
      
      doc.fontSize(11);
      recommendations.forEach(rec => {
        doc.text(rec);
        doc.moveDown(0.2);
      });

      doc.moveDown();
      
      // WCAG Compliance Information
      doc.fontSize(12).text("WCAG 2.1 Compliance Guidelines:", { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(10);
      doc.text("• Perceivable: Information and user interface components must be presentable to users in ways they can perceive.");
      doc.text("• Operable: User interface components and navigation must be operable.");
      doc.text("• Understandable: Information and the operation of user interface must be understandable.");
      doc.text("• Robust: Content must be robust enough to be interpreted reliably by a wide variety of user agents.");
      
      doc.moveDown();
      doc.text(`Report generated on: ${new Date().toLocaleString()}`);
      doc.text(`Total pages scanned: ${summarizedReport.length}`);
      doc.text(`Pages with issues: ${pagesWithIssues.length}`);
      doc.text(`Overall accessibility score: ${summary.score}%`);

      doc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      reject(error);
    }
  });
};

// Helper functions
function getScoreColor(score: number): string {
  if (score >= 90) return 'green';
  if (score >= 70) return 'orange';
  return 'red';
}

function getImpactColor(impact: string): string {
  switch (impact) {
    case 'critical': return 'red';
    case 'serious': return 'orange';
    case 'moderate': return 'blue';
    case 'minor': return 'gray';
    default: return 'black';
  }
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return 'No text available';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function getRecommendations(summary: Summary): string[] {
  const recommendations = [
    "1. Address all CRITICAL and SERIOUS issues first as they affect users the most",
    "2. Fix color contrast issues to ensure text is readable for users with visual impairments",
    "3. Add proper labels to all interactive elements (links, buttons, icons)",
    "4. Ensure proper document structure with landmarks and heading hierarchy",
    "5. Test with screen readers and keyboard navigation after making changes",
    "6. Implement automated accessibility testing in your development workflow",
    "7. Focus on keyboard navigation and focus management for all interactive elements",
    "8. Ensure all form elements have proper labels, instructions, and error messages",
    "9. Use semantic HTML elements to improve screen reader compatibility",
    "10. Conduct regular accessibility audits and user testing with people with disabilities"
  ];

  // Filter recommendations based on actual issues found
  const filteredRecommendations = recommendations.filter(rec => {
    if (rec.includes('CRITICAL') && summary.critical === 0) return false;
    if (rec.includes('color contrast') && !hasColorContrastIssues(summary)) return false;
    if (rec.includes('landmarks') && !hasLandmarkIssues(summary)) return false;
    return true;
  });

  return filteredRecommendations.length > 0 ? filteredRecommendations : [
    "1. Maintain current accessibility standards with regular testing",
    "2. Continue monitoring for new accessibility issues during development",
    "3. Consider user testing with people with disabilities for further improvements"
  ];
}

function hasColorContrastIssues(summary: Summary): boolean {
  // This would need to be determined from the actual issue data
  // For now, return true if there are serious issues (likely color contrast)
  return summary.serious > 0;
}

function hasLandmarkIssues(summary: Summary): boolean {
  // This would need to be determined from the actual issue data
  // For now, return true if there are moderate issues (likely landmarks)
  return summary.moderate > 0;
}