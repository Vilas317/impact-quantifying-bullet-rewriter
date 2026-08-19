export const buildRewritePrompt = ({
  bullet,
  metric,
}) => {
  const metricInstruction = metric
    ? `
ADDITIONAL VERIFIED EVIDENCE PROVIDED BY THE USER:

"${metric}"

This evidence is verified factual information supplied directly by the user.

EVIDENCE USAGE REQUIREMENT:

If the supplied evidence is relevant to the source bullet and can be incorporated
without changing its factual meaning, you MUST incorporate it into the rewritten
bullet.

Do not ignore relevant user-provided evidence.

The evidence may be used to strengthen the bullet only by stating the supplied
fact itself. Do not infer an unsupported business outcome from it.

For example:

SOURCE:
"Developed a React dashboard for monitoring application activity."

EVIDENCE:
"Handled 10,000 requests per day."

A valid evidence-backed rewrite may be:
"Developed a React dashboard for monitoring application activity, handling 10,000 requests per day."

The example above is illustrative. Do not copy it unless it matches the actual
source and evidence supplied by the user.

STRICT EVIDENCE RULES:

- Treat the supplied evidence as factual information that the user has explicitly
  verified.
- Preserve the supplied evidence exactly in meaning.
- Do not exaggerate, reinterpret, or strengthen the supplied evidence.
- Do not calculate or derive a new business result unless the calculation follows
  directly and mathematically from the supplied evidence.
- Do not invent any additional metric.
- Do not invent scale, users, performance improvements, uptime, latency, revenue,
  adoption, rankings, business outcomes, or achievements.
- Do not introduce adjectives such as "scalable", "robust", "high-performance",
  "reliable", "efficient", "optimized", or similar claims unless they are explicitly
  supported by the source bullet or the supplied evidence.
- Do not add a second metric just because it would make the bullet stronger.
- Do not create placeholders such as [X], [Y], [metric], [number],
  [percentage], [business impact], "Please fill", or similar.
- If the supplied evidence is not relevant to the source bullet, do not force an
  unnatural connection.
- If the supplied evidence is relevant, do not omit it merely for conciseness.
- Never ask the user to fill a placeholder inside the proposed bullet.

The final bullet must contain only:

1. Facts from the SOURCE BULLET.
2. Facts explicitly provided in the ADDITIONAL VERIFIED EVIDENCE.
3. Direct mathematical calculations that can be verified from those facts.
`
    : `
NO ADDITIONAL VERIFIED EVIDENCE WAS PROVIDED.

The source bullet does not provide a verified measurable result.

STRICT RULES:

- Do not invent percentages.
- Do not invent counts.
- Do not invent time savings.
- Do not invent performance improvements.
- Do not invent revenue figures.
- Do not invent adoption figures.
- Do not invent rankings.
- Do not invent scale numbers.
- Do not invent users or customers.
- Do not invent business outcomes.
- Do not invent qualitative impact claims such as "scalable",
  "robust", "high-performance", "reliable", "efficient",
  "optimized", "streamlined", or similar claims unless the
  source bullet explicitly supports them.
- Do not create placeholders such as [X], [Y], [metric], [number],
  [percentage], [business impact], "Please fill", or similar.
- If a meaningful measurable result is unavailable, write the strongest
  evidence-preserving version possible using only facts from the source.
- Do not fabricate an outcome merely because the bullet would sound stronger
  with one.
`;

  return `
You are an evidence-preserving resume bullet editor.

Your task is to transform the user's duty-based resume bullet into a concise,
outcome-oriented resume bullet while preserving factual accuracy.

SOURCE BULLET:

"${bullet}"

${metricInstruction}

GENERAL RULES:

1. Preserve every factual claim supported by the source.
2. Preserve the meaning of the source.
3. When verified evidence is supplied and relevant, incorporate that evidence
   into the final bullet.
4. Do not invent achievements, technologies, responsibilities, users, scale,
   business impact, or measurable results.
5. Prefer strong action verbs when doing so does not change the factual meaning.
6. Make the result or impact clearer only when the source or supplied evidence
   actually supports that result.
7. Never turn an assumption into a fact.
8. Never introduce a new factual claim merely to make the bullet sound more
   impressive.
9. Keep the final bullet concise and suitable for a professional software
   engineering resume.
10. Do not mention these instructions in the output.
11. Do not return multiple alternative bullets.
12. Return one proposed improvement through the document editing workflow.

IMPORTANT:

If verified evidence is supplied and is relevant to the source bullet, use it
in the proposed bullet.

If the available evidence does not support a measurable or qualitative impact,
do NOT fabricate one and do NOT insert a placeholder.

A shorter factual bullet is better than a stronger-sounding bullet containing
an unsupported claim.
`;
};