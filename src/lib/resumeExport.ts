import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { ResumeResponse } from "./ai-phase2";

/**
 * Export resume as PDF
 */
export async function exportResumePDF(resume: ResumeResponse, fileName: string = "Resume"): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: string = "#000000") => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(color);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 2;
  };

  const addSectionHeader = (title: string) => {
    yPosition += 5;
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 7;
    addText(title.toUpperCase(), 12, true, "#1a365d");
    yPosition += 2;
  };

  // Header - Name
  const header = resume.resume.header;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#1a365d");
  doc.text(header.name || "Professional Resume", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Contact info
  const contactInfo = [header.email, header.phone, header.location].filter(Boolean).join(" | ");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#666666");
  doc.text(contactInfo, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;

  if (header.linkedIn) {
    doc.text(header.linkedIn, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 5;
  }

  // Professional Summary
  if (resume.resume.summary) {
    addSectionHeader("Professional Summary");
    addText(resume.resume.summary);
  }

  // Technical Skills
  const skills = resume.resume.skills;
  if (skills && (skills.processes?.length || skills.positions?.length || skills.additional?.length)) {
    addSectionHeader("Technical Skills");
    
    if (skills.processes?.length) {
      addText(`Welding Processes: ${skills.processes.join(", ")}`);
    }
    if (skills.positions?.length) {
      addText(`Positions: ${skills.positions.join(", ")}`);
    }
    if (skills.additional?.length) {
      addText(`Additional: ${skills.additional.join(", ")}`);
    }
  }

  // Certifications
  const certs = resume.resume.certifications;
  if (certs && certs.items?.length) {
    addSectionHeader("Certifications");
    certs.items.forEach((cert: string) => {
      addText(`• ${cert}`);
    });
  }

  // Work Experience
  const experience = resume.resume.experience;
  if (experience?.length) {
    addSectionHeader("Professional Experience");
    experience.forEach((job) => {
      addText(`${job.title} | ${job.company}`, 11, true);
      if (job.location) addText(job.location, 9, false, "#666666");
      if (job.dates) addText(job.dates, 9, false, "#666666");
      yPosition += 2;
      
      job.bullets?.forEach((bullet: string) => {
        if (bullet) addText(`• ${bullet}`);
      });
      yPosition += 3;
    });
  }

  // Education
  const education = resume.resume.education;
  if (education?.length) {
    addSectionHeader("Education");
    education.forEach((edu) => {
      addText(`${edu.degree} - ${edu.school}`, 10, true);
      if (edu.year) addText(edu.year, 9, false, "#666666");
      yPosition += 2;
    });
  }

  // Save
  doc.save(`${fileName.replace(/\s+/g, "_")}_Resume.pdf`);
}

/**
 * Export resume as Word document
 */
export async function exportResumeWord(resume: ResumeResponse, fileName: string = "Resume"): Promise<void> {
  const header = resume.resume.header;
  const children: Paragraph[] = [];

  // Helper for section headers
  const createSectionHeader = (text: string) => {
    return new Paragraph({
      text: text.toUpperCase(),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      border: {
        bottom: { color: "1a365d", space: 1, style: BorderStyle.SINGLE, size: 6 },
      },
    });
  };

  // Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: header.name || "Professional Resume",
          bold: true,
          size: 48,
          color: "1a365d",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Contact info
  const contactInfo = [header.email, header.phone, header.location].filter(Boolean).join(" | ");
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactInfo,
          size: 20,
          color: "666666",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  if (header.linkedIn) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: header.linkedIn,
            size: 20,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // Professional Summary
  if (resume.resume.summary) {
    children.push(createSectionHeader("Professional Summary"));
    children.push(
      new Paragraph({
        text: resume.resume.summary,
        spacing: { after: 200 },
      })
    );
  }

  // Technical Skills
  const skills = resume.resume.skills;
  if (skills && (skills.processes?.length || skills.positions?.length || skills.additional?.length)) {
    children.push(createSectionHeader("Technical Skills"));
    
    if (skills.processes?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Welding Processes: ", bold: true }),
            new TextRun({ text: skills.processes.join(", ") }),
          ],
          spacing: { after: 100 },
        })
      );
    }
    if (skills.positions?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Positions: ", bold: true }),
            new TextRun({ text: skills.positions.join(", ") }),
          ],
          spacing: { after: 100 },
        })
      );
    }
    if (skills.additional?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Additional Skills: ", bold: true }),
            new TextRun({ text: skills.additional.join(", ") }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }

  // Certifications
  const certs = resume.resume.certifications;
  if (certs && certs.items?.length) {
    children.push(createSectionHeader("Certifications"));
    certs.items.forEach((cert: string) => {
      children.push(
        new Paragraph({
          text: `• ${cert}`,
          spacing: { after: 80 },
        })
      );
    });
  }

  // Work Experience
  const experience = resume.resume.experience;
  if (experience?.length) {
    children.push(createSectionHeader("Professional Experience"));
    experience.forEach((job) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${job.title} | ${job.company}`, bold: true, size: 24 }),
          ],
          spacing: { before: 200, after: 50 },
        })
      );
      
      if (job.location || job.dates) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: [job.location, job.dates].filter(Boolean).join(" | "),
                size: 20,
                color: "666666",
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      job.bullets?.forEach((bullet: string) => {
        if (bullet) {
          children.push(
            new Paragraph({
              text: `• ${bullet}`,
              spacing: { after: 50 },
            })
          );
        }
      });
    });
  }

  // Education
  const education = resume.resume.education;
  if (education?.length) {
    children.push(createSectionHeader("Education"));
    education.forEach((edu) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.degree} - ${edu.school}`, bold: true }),
          ],
          spacing: { after: 50 },
        })
      );
      if (edu.year) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.year, size: 20, color: "666666" }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName.replace(/\s+/g, "_")}_Resume.docx`);
}

/**
 * Export resume as plain text
 */
export function exportResumeTxt(resume: ResumeResponse, fileName: string = "Resume"): void {
  const text = resume.resume.formattedText || "";
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.replace(/\s+/g, "_")}_Resume.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
