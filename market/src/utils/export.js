/**
 * utils/export.js
 * PDF export using html2canvas + jsPDF
 */

export async function exportPDF(elementId, title = "MarketLens Report") {
  try {
    const { default: html2canvas } = await import("html2canvas");
    const { default: jsPDF } = await import("jspdf");

    const element = document.getElementById(elementId);
    if (!element) {
      alert("Could not find report element to export.");
      return;
    }

    // Show loading state
    const btn = document.activeElement;
    const originalText = btn?.textContent;
    if (btn) btn.textContent = "Exporting…";

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#060810",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width / 2, canvas.height / 2],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`${title.slice(0, 40).replace(/[^a-z0-9]/gi, "_")}_MarketLens.pdf`);

    if (btn && originalText) btn.textContent = originalText;
  } catch (err) {
    console.error("PDF export error:", err);
    alert("PDF export failed. Please try again.");
  }
}