import { describe, expect, it } from "vitest";

import { analyzeEvidence } from "./evidenceGuard";

describe("analyzeEvidence", () => {
  it("allows a safe paraphrase that does not introduce a new claim", () => {
    const result = analyzeEvidence({
      original:
        "Developed REST APIs using Node.js and Express.",

      proposed:
        "Engineered RESTful APIs using Node.js and Express.",

      explanation:
        "I made the resume bullet more concise and action-oriented.",
    });

    expect(result.requiresEvidence).toBe(false);
    expect(result.unsupportedClaims).toEqual([]);
    expect(result.unsupportedMetrics).toEqual([]);
  });

  it("requires evidence when the rewrite introduces unsupported impact claims", () => {
    const result = analyzeEvidence({
      original:
        "Developed REST APIs using Node.js and Express.",

      proposed:
        "Developed high-performance REST APIs using Node.js and Express, reducing API latency by 40%.",

      explanation:
        "I improved the bullet by highlighting performance improvements.",
    });

    expect(result.requiresEvidence).toBe(true);

    expect(
      result.unsupportedClaims.length,
    ).toBeGreaterThan(0);

    expect(
      result.unsupportedMetrics.length,
    ).toBeGreaterThan(0);
  });

  it("allows a metric that already exists in the original bullet", () => {
    const result = analyzeEvidence({
      original:
        "Handled 10,000 API requests per day.",

      proposed:
        "Processed 10,000 API requests daily.",

      explanation:
        "I made the bullet more concise while preserving the metric.",
    });

    expect(result.requiresEvidence).toBe(false);
    expect(result.unsupportedMetrics).toEqual([]);
  });

  it("allows a new metric when the user explicitly supplies it as evidence", () => {
    const result = analyzeEvidence({
      original:
        "Developed REST APIs using Node.js and Express.",

      proposed:
        "Developed REST APIs using Node.js and Express, supporting 10,000 API requests daily.",

      explanation:
        "I added the measurable result provided by the user.",

      evidence:
        "Handled 10,000 API requests per day.",
    });

    expect(result.requiresEvidence).toBe(false);
    expect(result.unsupportedMetrics).toEqual([]);
  });

  it("rejects a metric that is neither in the original nor user evidence", () => {
    const result = analyzeEvidence({
      original:
        "Developed REST APIs using Node.js and Express.",

      proposed:
        "Developed REST APIs using Node.js and Express, supporting 10,000 API requests daily.",

      explanation:
        "I added a measurable result.",

      evidence: "",
    });

    expect(result.requiresEvidence).toBe(true);

    expect(
      result.unsupportedMetrics.length,
    ).toBeGreaterThan(0);
  });

  it("rejects unresolved placeholders", () => {
    const result = analyzeEvidence({
      original:
        "Developed REST APIs using Node.js and Express.",

      proposed:
        "Developed REST APIs using Node.js and Express, reducing latency by [X]%.",

      explanation:
        "I added a placeholder for the missing metric.",
    });

    expect(result.requiresEvidence).toBe(true);

    expect(
      result.unsupportedClaims,
    ).toContain("placeholder");
  });

  it("requires evidence for unsupported responsibility claims", () => {
    const result = analyzeEvidence({
      original:
        "Developed REST APIs using Node.js and Express.",

      proposed:
        "Developed REST APIs using Node.js and Express to support backend services.",

      explanation:
        "I made the bullet more outcome-oriented.",
    });

    expect(result.requiresEvidence).toBe(true);

    expect(
      result.unsupportedClaims,
    ).toContain("support");
  });

  it("allows an impact synonym when the underlying claim exists in the original", () => {
    const result = analyzeEvidence({
      original:
        "Developed REST APIs using Node.js and Express to improve backend performance.",

      proposed:
        "Engineered REST APIs using Node.js and Express to enhance backend performance.",

      explanation:
        "I made the bullet more concise while preserving the original impact claim.",
    });

    expect(result.requiresEvidence).toBe(false);
    expect(result.unsupportedClaims).toEqual([]);
  });
});