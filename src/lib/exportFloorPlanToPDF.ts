// exportFloorPlanToPDF.ts
// Utility to export SVG floor plan to PDF

import jsPDF from "jspdf";

export function exportFloorPlanToPDF(svgElement: SVGSVGElement, fileName = "floorplan.pdf") {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new window.Image();
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [img.width, img.height] });
    pdf.addImage(imgData, "PNG", 0, 0, img.width, img.height);
    pdf.save(fileName);
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
