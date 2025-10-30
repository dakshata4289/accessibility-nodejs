import PDFDocument from "pdfkit";

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

export const generateEndUserPDF = (
  summarizedReport: any[],
  summary: Summary,
  scannedWebsite: ScannedWebsite
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text("End User Accessibility Summary", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Website: ${scannedWebsite.url}`);
      doc.text(`Date: ${scannedWebsite.date}`);
      doc.moveDown();

      doc.fontSize(14).text("Accessibility Overview", { underline: true });
      doc.fontSize(12).list([
        `Overall Score: ${summary.score}`,
        `Total Issues Found: ${summary.totalIssues}`,
      ]);

      doc.moveDown();
      doc.fontSize(14).text("Impact Breakdown", { underline: true });
      doc.fontSize(12).list([
        `Critical Issues: ${summary.critical}`,
        `Serious Issues: ${summary.serious}`,
        `Moderate Issues: ${summary.moderate}`,
        `Minor Issues: ${summary.minor}`,
      ]);

      doc.moveDown();
      doc.text(
        "This summary provides an overview of how accessible your website is for users with disabilities. For detailed technical fixes, refer to the developer report."
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
