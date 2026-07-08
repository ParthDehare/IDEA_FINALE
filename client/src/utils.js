export const DARK = {
  bg: "#262729ff",
  card: "#2d2d2eff",
  cardAlt: "#16181fff",
  border: "rgba(255, 255, 255, 0.10)",
  text: "#f1f5f9",
  text2: "#8a9ab0",
  accent: "#64748b",
  teal: "#10b981",
  cyan: "#06b6d4",
  red: "#f43f5e",
  amber: "#fb923c",
  green: "#10b981",
};

export const LIGHT = {
  bg: "#f3f4f6",
  card: "#ffffff",
  cardAlt: "#f9fafb",
  border: "rgba(79, 70, 229, 0.35)",
  text: "#0f172a",
  text2: "#64748b",
  accent: "#4f46e5",
  teal: "#0d9488",
  cyan: "#0284c7",
  red: "#e11d48",
  amber: "#ea580c",
  green: "#16a34a",
};

export const TIER_COLORS = (t) => ({
  CRITICAL: t.red, HIGH: t.amber, WATCH: t.cyan, NORMAL: t.green,
});

export const ROWS_PER_PAGE = 20;

import { fetchWithAuth } from './apiService';
export const riskTier = (score) => {
  if (score >= 70) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 30) return "WATCH";
  return "NORMAL";
};

export const forceDownloadPDF = async (pdfUrl, empId) => {
  try {
    const response = await fetchWithAuth(pdfUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Fraud_Evidence_${empId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download error:", error);
  }
};
