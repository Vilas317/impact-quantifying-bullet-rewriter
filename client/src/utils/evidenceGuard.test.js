import {
  describe,
  expect,
  it,
} from "vitest";

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

  /*
   * Regression test for the exact bug we have been debugging.
   *
   * Original:
   *   User engagement increased by 40%
   *
   * Proposed:
   *   Increased user engagement by 40%
   *
   * The grammatical order changes, but the factual claim
   * does not.
   */
  it("allows the same impact claim when the impact verb moves before the subject", () => {
    const result = analyzeEvidence({
      original:
        "User engagement increased by 40% after the dashboard launch.",

      proposed:
        "Increased user engagement by 40% following the dashboard launch.",

      explanation:
        "I made the bullet more concise while preserving the original engagement metric.",
    });

    expect(result.requiresEvidence).toBe(false);
    expect(result.unsupportedClaims).toEqual([]);
    expect(result.unsupportedMetrics).toEqual([]);
  });

  /*
   * The guard must not become too permissive.
   *
   * "User engagement increased by 40%"
   *
   * does NOT support:
   *
   * "Revenue increased by 40%"
   */
  it("rejects a different impact subject even when the verb and metric are the same", () => {
    const result = analyzeEvidence({
      original:
        "User engagement increased by 40%.",

      proposed:
        "Revenue increased by 40%.",

      explanation:
        "I made the bullet more outcome-oriented.",
    });

    expect(result.requiresEvidence).toBe(true);
    expect(result.unsupportedClaims.length).toBeGreaterThan(0);
  });

  /*
   * The metric itself must also remain supported.
   */
  it("rejects a changed percentage even when the impact subject is preserved", () => {
    const result = analyzeEvidence({
      original:
        "User engagement increased by 40%.",

      proposed:
        "Increased user engagement by 50%.",

      explanation:
        "I made the bullet more concise.",
    });

    expect(result.requiresEvidence).toBe(true);
    expect(result.unsupportedMetrics).toContain("50%");
  });

  it("allows a new evidence-backed request metric with a grammatical impact rewrite", () => {
    const result = analyzeEvidence({
      original:
        "User engagement increased by 40% after the dashboard launch.",

      proposed:
        "Increased user engagement by 40% following the dashboard launch, handling 10,000 requests per day.",

      explanation:
        "I incorporated the verified request volume supplied by the user.",

      evidence:
        "Handled 10,000 requests per day.",
    });

    expect(result.requiresEvidence).toBe(false);
    expect(result.unsupportedClaims).toEqual([]);
    expect(result.unsupportedMetrics).toEqual([]);
  });

  it("rejects an unsupported qualitative modifier", () => {
    const result = analyzeEvidence({
      original:
        "Built a React dashboard.",

      proposed:
        "Built a robust React dashboard.",

      explanation:
        "I made the bullet stronger.",
    });

    expect(result.requiresEvidence).toBe(true);

    expect(
      result.unsupportedClaims,
    ).toContain("robust");
  });

  it("allows an existing qualitative modifier", () => {
    const result = analyzeEvidence({
      original:
        "Built a robust React dashboard.",

      proposed:
        "Developed a robust React dashboard.",

      explanation:
        "I made the bullet more concise.",
    });

    expect(result.requiresEvidence).toBe(false);
    expect(result.unsupportedClaims).toEqual([]);
  });

  it("allows grammatical variants of reduce when the original claim is preserved", () => {
    const result = analyzeEvidence({
      original:
        "Reduced API latency by 30%.",

      proposed:
        "Reducing API latency by 30% through REST API improvements.",

      explanation:
        "I preserved the original measurable impact.",
    });

    expect(result.requiresEvidence).toBe(false);
    expect(result.unsupportedClaims).toEqual([]);
    expect(result.unsupportedMetrics).toEqual([]);
  });

  it("allows grammatical variants of improve when the original claim is preserved", () => {
    const result = analyzeEvidence({
      original:
        "Improved backend performance by optimizing API processing.",

      proposed:
        "Enhanced backend performance by optimizing API processing.",

      explanation:
        "I preserved the original performance claim.",
    });

    expect(result.requiresEvidence).toBe(false);
    expect(result.unsupportedClaims).toEqual([]);
  });
});