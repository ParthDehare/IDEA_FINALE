// VaultMind 3.0 — Client-Side Constants & Backend Presentation Helpers
// Removed duplicate client-side scoring (`scoreTransaction`) to enforce Single Source of Truth from backend.

export const SENTIMENT_KEYWORDS = [
  /\bstolen\b/i, /\bbribe\b/i, /\bhacked\b/i, /\bextortion\b/i,
  /\bunauthorized\b/i, /\billegal\b/i, /\bthreat\b/i,
  /\bfraud\b/i, /\bmoney.?launder/i, /\bforged?\b/i,
];

/**
 * Returns triggered rules or signals strictly provided by the backend (Single Source of Truth).
 * Falls back cleanly if only a single reason string is provided by the orchestrator.
 */
export function getTriggeredRules(tx) {
  if (Array.isArray(tx?.signals_triggered) && tx.signals_triggered.length > 0) {
    return tx.signals_triggered;
  }
  if (Array.isArray(tx?.rules_triggered) && tx.rules_triggered.length > 0) {
    return tx.rules_triggered;
  }
  if (tx?.reason && typeof tx.reason === "string" && tx.reason !== "No anomaly detected" && tx.reason !== "None") {
    return [tx.reason];
  }
  return [];
}

/**
 * Extracts NLP keyword flags or signals passed from backend Agent 4 (ComplaintSignal).
 */
export function extractNlpFlags(tx) {
  if (Array.isArray(tx?.nlp_flags) && tx.nlp_flags.length > 0) {
    return tx.nlp_flags;
  }
  const flags = [];
  const text = tx?.raw_complaint_text || tx?.complaint_text || "";
  if (text) {
    for (const pat of SENTIMENT_KEYWORDS) {
      const m = text.match(pat);
      if (m) flags.push(`Keyword: '${m[0]}'`);
    }
  }
  return flags;
}

export function riskTier(score) {
  if (score >= 70) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 30) return "WATCH";
  return "NORMAL";
}
