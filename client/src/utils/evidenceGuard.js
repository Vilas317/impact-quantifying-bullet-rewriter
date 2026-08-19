const IMPACT_PATTERNS = [
  {
    pattern: /\bscalable\b/gi,
    label: "scalable",
  },
  {
    pattern: /\bscalability\b/gi,
    label: "scalability",
  },
  {
    pattern: /\bhigh[-\s]?performance\b/gi,
    label: "high-performance",
  },
  {
    pattern: /\bhigh[-\s]?performing\b/gi,
    label: "high-performing",
  },
  {
    pattern: /\boptimized?\b/gi,
    label: "optimized",
  },
  {
    pattern: /\boptimization\b/gi,
    label: "optimization",
  },
  {
    pattern: /\bimprov(?:e|ed|es|ing|ement)\b/gi,
    label: "improvement",
  },
  {
    pattern: /\bboost(?:ed|s|ing)?\b/gi,
    label: "boosted",
  },
  {
    pattern: /\bincreas(?:e|ed|es|ing)\b/gi,
    label: "increased",
  },
  {
    pattern: /\breduc(?:e|ed|es|ing)\b/gi,
    label: "reduced",
  },
  {
    pattern: /\bstreamlin(?:e|ed|es|ing)\b/gi,
    label: "streamlined",
  },
  {
    pattern: /\benhanc(?:e|ed|es|ing)\b/gi,
    label: "enhanced",
  },
  {
    pattern: /\baccelerat(?:e|ed|es|ing)\b/gi,
    label: "accelerated",
  },

  // Unsupported qualitative claims.
  {
    pattern: /\brobust\b/gi,
    label: "robust",
  },
  {
    pattern: /\breliable\b/gi,
    label: "reliable",
  },
  {
    pattern: /\befficient\b/gi,
    label: "efficient",
  },
  {
    pattern: /\bseamless\b/gi,
    label: "seamless",
  },
  {
    pattern: /\beffectiv(?:e|ely)\b/gi,
    label: "effective",
  },
  {
    pattern: /\bpowerful\b/gi,
    label: "powerful",
  },
  {
    pattern: /\bsecure\b/gi,
    label: "secure",
  },

  // Common outcome phrases.
  {
    pattern: /\bimprov(?:e|ed|es|ing)\s+\w+/gi,
    label: "improved result",
  },
  {
    pattern: /\breduc(?:e|ed|es|ing)\s+\w+/gi,
    label: "reduced result",
  },
  {
    pattern: /\bincreas(?:e|ed|es|ing)\s+\w+/gi,
    label: "increased result",
  },
  {
    pattern: /\bboost(?:ed|s|ing)\s+\w+/gi,
    label: "boosted result",
  },
  {
    pattern: /\bstreamlin(?:e|ed|es|ing)\s+\w+/gi,
    label: "streamlined result",
  },

  // Responsibility / capability claims.
  {
    pattern: /\bsupport(?:ed|s|ing)?\b/gi,
    label: "support",
  },
  {
    pattern: /\benabl(?:e|ed|es|ing)\b/gi,
    label: "enabled",
  },
  {
    pattern: /\bmaintain(?:ed|s|ing)?\b/gi,
    label: "maintained",
  },

  // Unresolved placeholders.
  {
    pattern: /\[[^\]]+\]/gi,
    label: "placeholder",
  },
  {
    pattern: /\bplease\s+fill\b/gi,
    label: "missing value",
  },
];

const METRIC_PATTERNS = [
  // Percentages.
  /\b\d+(?:\.\d+)?\s*%/gi,

  // Time measurements.
  /\b\d+(?:\.\d+)?\s*(?:ms|milliseconds|s|sec|seconds|minutes|hours|days)\b/gi,

  // Count-based metrics.
  /\b\d[\d,]*(?:\.\d+)?\s*(?:users|requests|customers|records|transactions|downloads|visits|items|orders|documents|api\s+requests)\b/gi,

  // Large-number shorthand.
  /\b\d[\d,]*(?:\.\d+)?\s*(?:k|m|million|billion)\b/gi,

  // Multipliers.
  /\b\d+(?:\.\d+)?x\b/gi,
];

const IMPACT_SYNONYMS = {
  improve: [
    "improve",
    "improved",
    "improves",
    "improving",
    "enhance",
    "enhanced",
    "enhances",
    "enhancing",
  ],

  optimize: [
    "optimize",
    "optimized",
    "optimizes",
    "optimizing",
  ],
};

const normalize = (value = "") =>
  value
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\w\s%-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeMetric = (value = "") =>
  normalize(value)
    .replace(/\bapi\s+requests\b/g, "requests")
    .replace(/\bper\s+day\b/g, "daily")
    .replace(/\beach\s+day\b/g, "daily")
    .replace(/\s+/g, " ")
    .trim();

const extractMetrics = (text = "") => {
  const metrics = [];

  for (const pattern of METRIC_PATTERNS) {
    const matches = text.match(pattern);

    if (!matches) {
      continue;
    }

    for (const match of matches) {
      const normalizedMetric =
        normalizeMetric(match);

      if (
        normalizedMetric &&
        !metrics.some(
          (metric) =>
            normalizeMetric(metric) ===
            normalizedMetric,
        )
      ) {
        metrics.push(normalizedMetric);
      }
    }
  }

  return metrics;
};

const containsMetric = (text = "") =>
  extractMetrics(text).length > 0;

const extractImpactClaims = (text = "") => {
  const claims = [];

  for (const item of IMPACT_PATTERNS) {
    const matches = text.match(item.pattern);

    if (!matches) {
      continue;
    }

    for (const match of matches) {
      const normalizedMatch =
        normalize(match);

      if (
        normalizedMatch &&
        !claims.some(
          (claim) =>
            claim.toLowerCase() ===
            normalizedMatch,
        )
      ) {
        claims.push(normalizedMatch);
      }
    }
  }

  return claims;
};

const hasMetricRequest = (explanation = "") => {
  const text = explanation.toLowerCase();

  const metricTerms = [
    "metric",
    "measurable",
    "quantify",
    "quantitative",
    "percentage",
    "requests per second",
    "latency",
    "uptime",
    "users",
    "scale",
  ];

  return metricTerms.some((term) =>
    text.includes(term),
  );
};

const claimSupportedByText = (
  claim,
  text,
) => {
  const normalizedClaim =
    normalize(claim);

  const normalizedText =
    normalize(text);

  // Direct support.
  if (
    normalizedText.includes(
      normalizedClaim,
    )
  ) {
    return true;
  }

  // Controlled impact-verb synonyms.
  for (const synonymGroup of Object.values(
    IMPACT_SYNONYMS,
  )) {
    if (
      !synonymGroup.includes(
        normalizedClaim,
      )
    ) {
      continue;
    }

    if (
      synonymGroup.some((synonym) =>
        normalizedText.includes(synonym),
      )
    ) {
      return true;
    }
  }

  return false;
};

const metricSupportedByText = (
  metric,
  text,
) => {
  const normalizedMetric =
    normalizeMetric(metric);

  return extractMetrics(text).some(
    (existingMetric) =>
      normalizeMetric(existingMetric) ===
      normalizedMetric,
  );
};

/*
 * A "supporting" claim can be accepted when it directly
 * accompanies a metric that the user explicitly supplied
 * as evidence.
 *
 * Example:
 *
 * Evidence:
 * "Handled 10,000 API requests per day."
 *
 * Proposed:
 * "supporting 10,000 API requests daily"
 *
 * The metric is explicitly supported by the user evidence,
 * so this phrasing does not introduce an unsupported
 * quantitative claim.
 */
const supportClaimBackedByEvidence = ({
  claim,
  proposed,
  evidence,
}) => {
  /*
   * The regex may return:
   *
   * support
   * supported
   * supports
   * supporting
   *
   * Treat all of these as the same responsibility verb
   * for this specific evidence-backed check.
   */
  const isSupportClaim =
    claim === "support" ||
    claim === "supported" ||
    claim === "supports" ||
    claim === "supporting";

  if (!isSupportClaim) {
    return false;
  }

  const proposedMetrics =
    extractMetrics(proposed);

  if (proposedMetrics.length === 0) {
    return false;
  }

  return proposedMetrics.some((metric) =>
    metricSupportedByText(
      metric,
      evidence,
    ),
  );
};

export const analyzeEvidence = ({
  original = "",
  proposed = "",
  explanation = "",
  evidence = "",
}) => {
  const impactClaims =
    extractImpactClaims(proposed);

  const proposedMetrics =
    extractMetrics(proposed);

  const originalMetrics =
    extractMetrics(original);

  const evidenceMetrics =
    extractMetrics(evidence);

  /*
   * Check qualitative/responsibility claims.
   */
  const unsupportedClaims =
    impactClaims.filter((claim) => {
      const supportedByOriginal =
        claimSupportedByText(
          claim,
          original,
        );

      const supportedByEvidence =
        claimSupportedByText(
          claim,
          evidence,
        );

      const supportedByMetricEvidence =
        supportClaimBackedByEvidence({
          claim,
          proposed,
          evidence,
        });

      return (
        !supportedByOriginal &&
        !supportedByEvidence &&
        !supportedByMetricEvidence
      );
    });

  /*
   * Every proposed metric must be supported by either:
   *
   * - the original bullet, or
   * - user-provided evidence.
   */
  const unsupportedMetrics =
    proposedMetrics.filter((metric) => {
      const supportedByOriginal =
        metricSupportedByText(
          metric,
          original,
        );

      const supportedByEvidence =
        metricSupportedByText(
          metric,
          evidence,
        );

      return (
        !supportedByOriginal &&
        !supportedByEvidence
      );
    });

  /*
   * Placeholders must always be explicitly reported.
   */
  const containsPlaceholder =
    /\[[^\]]+\]/i.test(proposed);

  if (
    containsPlaceholder &&
    !unsupportedClaims.includes(
      "placeholder",
    )
  ) {
    unsupportedClaims.push(
      "placeholder",
    );
  }

  const containsMissingValue =
    /\bplease\s+fill\b/i.test(
      proposed,
    );

  if (
    containsMissingValue &&
    !unsupportedClaims.includes(
      "missing value",
    )
  ) {
    unsupportedClaims.push(
      "missing value",
    );
  }

  const proposalHasMetric =
    proposedMetrics.length > 0 ||
    containsMetric(proposed);

  const explanationRequestsMetric =
    hasMetricRequest(explanation);

  const missingRequestedMetric =
    explanationRequestsMetric &&
    !proposalHasMetric;

  const requiresEvidence =
    unsupportedClaims.length > 0 ||
    unsupportedMetrics.length > 0 ||
    missingRequestedMetric;

  return {
    requiresEvidence,
    unsupportedClaims,
    unsupportedMetrics,
    proposalHasMetric,
    explanationRequestsMetric,
    missingRequestedMetric,
    originalMetrics,
    proposedMetrics,
    evidenceMetrics,
  };
};

export {
  containsMetric,
  extractMetrics,
  extractImpactClaims,
  normalize,
  normalizeMetric,
};