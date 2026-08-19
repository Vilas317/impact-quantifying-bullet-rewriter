const QUALITATIVE_CLAIM_PATTERNS = [
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

  // These are intentionally NOT included here:
  //
  // improve
  // improve*
  // enhance
  // enhance*
  // optimize
  // optimize*
  // increase
  // increase*
  // reduce
  // reduce*
  // boost
  // boost*
  // streamline
  // streamline*
  // accelerate
  // accelerate*
  //
  // They are handled semantically as impact claims below.

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
];

const RESPONSIBILITY_PATTERNS = [
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
];

const PLACEHOLDER_PATTERNS = [
  {
    pattern: /\[[^\]]+\]/gi,
    label: "placeholder",
  },
  {
    pattern: /\bplease\s+fill\b/gi,
    label: "missing value",
  },
];

const IMPACT_VERB_GROUPS = [
  {
    canonical: "improve",
    pattern:
      /\b(?:improve|improved|improves|improving|enhance|enhanced|enhances|enhancing)\b/gi,
  },
  {
    canonical: "optimize",
    pattern:
      /\b(?:optimize|optimized|optimizes|optimizing)\b/gi,
  },
  {
    canonical: "increase",
    pattern:
      /\b(?:increase|increased|increases|increasing)\b/gi,
  },
  {
    canonical: "reduce",
    pattern:
      /\b(?:reduce|reduced|reduces|reducing)\b/gi,
  },
  {
    canonical: "boost",
    pattern:
      /\b(?:boost|boosted|boosts|boosting)\b/gi,
  },
  {
    canonical: "streamline",
    pattern:
      /\b(?:streamline|streamlined|streamlines|streamlining)\b/gi,
  },
  {
    canonical: "accelerate",
    pattern:
      /\b(?:accelerate|accelerated|accelerates|accelerating)\b/gi,
  },
];

const OBJECT_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "that",
  "through",
  "to",
  "using",
  "via",
  "with",
  "while",
  "which",
  "after",
  "before",
  "following",
]);

const NON_OBJECT_WORDS = new Set([
  "significantly",
  "substantially",
  "dramatically",
  "materially",
  "measurably",
  "successfully",
  "effectively",
  "efficiently",
  "reliably",
]);

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

const getImpactGroupForVerb = (verb = "") => {
  const normalizedVerb = normalize(verb);

  return IMPACT_VERB_GROUPS.find((group) => {
    const pattern = new RegExp(
      group.pattern.source,
      "i",
    );

    return pattern.test(normalizedVerb);
  });
};

const isMetricToken = (word = "") => {
  return (
    /^\d+(?:\.\d+)?%$/.test(word) ||
    /^\d[\d,]*(?:\.\d+)?$/.test(word) ||
    /^\d+(?:\.\d+)?x$/.test(word)
  );
};

const cleanObjectWords = (words = []) =>
  words
    .map((word) =>
      word.replace(
        /^[^\w%-]+|[^\w%-]+$/g,
        "",
      ),
    )
    .filter(Boolean)
    .filter(
      (word) =>
        !OBJECT_STOP_WORDS.has(word) &&
        !NON_OBJECT_WORDS.has(word) &&
        !isMetricToken(word),
    );

const extractImpactObjectCandidates = (
  text = "",
) => {
  const normalized = normalize(text);
  const words = normalized
    .split(/\s+/)
    .filter(Boolean);

  const candidates = [];

  for (
    let index = 0;
    index < words.length;
    index += 1
  ) {
    const word = words[index];

    const group =
      getImpactGroupForVerb(word);

    if (!group) {
      continue;
    }

    /*
     * Verb before object:
     *
     * "increased user engagement"
     */
    const afterWords = [];

    for (
      let cursor = index + 1;
      cursor < words.length &&
      afterWords.length < 4;
      cursor += 1
    ) {
      const nextWord = words[cursor];

      if (
        OBJECT_STOP_WORDS.has(nextWord) ||
        isMetricToken(nextWord)
      ) {
        break;
      }

      afterWords.push(nextWord);
    }

    const cleanedAfterWords =
      cleanObjectWords(afterWords);

    if (cleanedAfterWords.length > 0) {
      candidates.push({
        canonical: group.canonical,
        words: cleanedAfterWords,
      });
    }

    /*
     * Object before verb:
     *
     * "user engagement increased"
     */
    const beforeWords = [];

    for (
      let cursor = index - 1;
      cursor >= 0 &&
      beforeWords.length < 4;
      cursor -= 1
    ) {
      const previousWord = words[cursor];

      if (
        OBJECT_STOP_WORDS.has(previousWord) ||
        isMetricToken(previousWord)
      ) {
        break;
      }

      beforeWords.unshift(previousWord);
    }

    const cleanedBeforeWords =
      cleanObjectWords(beforeWords);

    if (cleanedBeforeWords.length > 0) {
      candidates.push({
        canonical: group.canonical,
        words: cleanedBeforeWords,
      });
    }
  }

  return candidates;
};

const extractMetrics = (text = "") => {
  const metrics = [];

  const metricPatterns = [
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

  for (const pattern of metricPatterns) {
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

/*
 * Extract impact claims as:
 *
 *   canonical impact verb + meaningful object
 *
 * Example:
 *
 *   "User engagement increased by 40%"
 *
 * becomes:
 *
 *   "increase user engagement"
 *
 * And:
 *
 *   "Increased user engagement by 40%"
 *
 * becomes the same claim.
 */
const extractImpactClaims = (text = "") => {
  const claims = [];

  /*
   * Qualitative and responsibility claims.
   *
   * Notice that impact verbs are NOT here.
   */
  const simplePatterns = [
    ...QUALITATIVE_CLAIM_PATTERNS,
    ...RESPONSIBILITY_PATTERNS,
    ...PLACEHOLDER_PATTERNS,
  ];

  for (const item of simplePatterns) {
    const matches = text.match(item.pattern);

    if (!matches) {
      continue;
    }

    if (!claims.includes(item.label)) {
      claims.push(item.label);
    }
  }

  /*
   * Semantic impact claims.
   */
  const candidates =
    extractImpactObjectCandidates(text);

  for (const candidate of candidates) {
    const claim = [
      candidate.canonical,
      ...candidate.words,
    ].join(" ");

    if (!claims.includes(claim)) {
      claims.push(claim);
    }
  }

  return claims;
};

const hasMetricRequest = (
  explanation = "",
) => {
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

const impactClaimSupportedByText = (
  claim,
  text,
) => {
  const normalizedClaim =
    normalize(claim);

  const claimWords =
    normalizedClaim.split(/\s+/);

  if (claimWords.length < 2) {
    return false;
  }

  const canonicalVerb =
    getImpactGroupForVerb(
      claimWords[0],
    )?.canonical;

  if (!canonicalVerb) {
    return false;
  }

  const claimObjectWords =
    cleanObjectWords(
      claimWords.slice(1),
    );

  if (claimObjectWords.length === 0) {
    return false;
  }

  const candidates =
    extractImpactObjectCandidates(text);

  return candidates.some((candidate) => {
    if (
      candidate.canonical !==
      canonicalVerb
    ) {
      return false;
    }

    /*
     * Every meaningful object word from the claim
     * must exist in the source claim.
     *
     * This allows:
     *
     * "user engagement"
     *
     * and:
     *
     * "engagement user"
     *
     * to match without allowing:
     *
     * "revenue"
     *
     * to match "user engagement".
     */
    return claimObjectWords.every(
      (word) =>
        candidate.words.includes(word),
    );
  });
};

const simpleClaimSupportedByText = (
  claim,
  text,
) => {
  const normalizedClaim =
    normalize(claim);

  const normalizedText =
    normalize(text);

  if (
    normalizedText.includes(
      normalizedClaim,
    )
  ) {
    return true;
  }

  const synonymGroups = [
    [
      "improve",
      "improved",
      "improves",
      "improving",
      "enhance",
      "enhanced",
      "enhances",
      "enhancing",
    ],
    [
      "optimize",
      "optimized",
      "optimizes",
      "optimizing",
    ],
  ];

  for (const synonymGroup of synonymGroups) {
    if (
      !synonymGroup.includes(
        normalizedClaim,
      )
    ) {
      continue;
    }

    if (
      synonymGroup.some((synonym) =>
        normalizedText.includes(
          synonym,
        ),
      )
    ) {
      return true;
    }
  }

  return false;
};

const claimSupportedByText = (
  claim,
  text,
) => {
  const normalizedClaim =
    normalize(claim);

  const firstWord =
    normalizedClaim.split(/\s+/)[0];

  /*
   * Impact claims have the form:
   *
   * "increase user engagement"
   *
   * and therefore require semantic matching.
   */
  if (getImpactGroupForVerb(firstWord)) {
    return impactClaimSupportedByText(
      normalizedClaim,
      text,
    );
  }

  return simpleClaimSupportedByText(
    normalizedClaim,
    text,
  );
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

const supportClaimBackedByEvidence = ({
  claim,
  proposed,
  evidence,
}) => {
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

  const unsupportedClaims =
    impactClaims.filter((claim) => {
      if (
        claim === "placeholder" ||
        claim === "missing value"
      ) {
        return false;
      }

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