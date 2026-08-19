import { useState } from "react";
import {
  Check,
  FileCheck2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import BulletInput from "./components/BulletInput";
import LoadingState from "./components/LoadingState";
import MetricQuestion from "./components/MetricQuestion";
import ReviewPanel from "./components/ReviewPanel";

import {
  createRewrite,
  getRewriteStatus,
  reviewRewrite,
} from "./services/api";

import { analyzeEvidence } from "./utils/evidenceGuard";

const POLL_INTERVAL = 2000;
const MAX_POLLS = 30;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const stripHtml = (html = "") => {
  const parser = new DOMParser();

  const document = parser.parseFromString(
    html,
    "text/html",
  );

  return document.body.textContent || "";
};

const WORKFLOW_STEPS = [
  {
    number: 1,
    label: "Input",
  },
  {
    number: 2,
    label: "Rewrite",
  },
  {
    number: 3,
    label: "Review",
  },
  {
    number: 4,
    label: "Approved",
  },
];

const getActiveStep = (status) => {
  switch (status) {
    case "processing":
      return 2;

    case "review":
      return 3;

    case "completed":
      return 4;

    case "rejected":
      return 3;

    case "idle":
    default:
      return 1;
  }
};

const App = () => {
  const [bullet, setBullet] = useState("");
  const [metric, setMetric] = useState("");

  const [sessionId, setSessionId] = useState(null);
  const [jobId, setJobId] = useState(null);

  const [reviewData, setReviewData] = useState(null);

  const [evidenceAnalysis, setEvidenceAnalysis] =
    useState(null);

  const [status, setStatus] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeStep = getActiveStep(status);

  /*
   * Poll the SuperDocs job until it reaches
   * awaiting_approval or fails.
   *
   * supportingEvidence is intentionally passed separately
   * so the evidence guard can verify metrics that the user
   * explicitly supplied.
   */
  const pollJob = async (
    newJobId,
    supportingEvidence = "",
  ) => {
    for (
      let attempt = 1;
      attempt <= MAX_POLLS;
      attempt += 1
    ) {
      try {
        console.log(
          `[Impact Rewriter] Poll ${attempt}/${MAX_POLLS} for job ${newJobId}`,
        );

        const result =
          await getRewriteStatus(newJobId);

        console.log(
          "[Impact Rewriter] Job response:",
          result,
        );

        if (result.status === "awaiting_approval") {
          const pendingChanges =
            result.metadata?.pending_changes || [];

          const firstChange = pendingChanges[0];

          if (!firstChange) {
            throw new Error(
              "SuperDocs returned awaiting_approval but did not return a proposed change.",
            );
          }

          const original =
            stripHtml(firstChange.old_html);

          const proposed =
            firstChange.new_html || "";

          const explanation =
            firstChange.ai_explanation || "";

          const analysis = analyzeEvidence({
            original,
            proposed,
            explanation,
            evidence: supportingEvidence,
          });

          console.log(
            "[Impact Rewriter] Evidence analysis:",
            analysis,
          );

          setReviewData({
            changeId: firstChange.change_id,
            original,
            proposed,
            explanation,
          });

          setEvidenceAnalysis(analysis);

          setStatus("review");
          setLoading(false);

          return;
        }

        if (
          result.status === "failed" ||
          result.status === "error"
        ) {
          throw new Error(
            result.error ||
              "SuperDocs failed to process the request.",
          );
        }

        if (attempt < MAX_POLLS) {
          await sleep(POLL_INTERVAL);
        }
      } catch (requestError) {
        console.error(
          "[Impact Rewriter] Polling error:",
          requestError,
        );

        setStatus("error");
        setLoading(false);
        setError(requestError.message);

        return;
      }
    }

    setStatus("error");
    setLoading(false);

    setError(
      "The rewrite took too long to complete. Please try again.",
    );
  };

  /*
   * sourceBullet and providedMetric are intentionally separate.
   *
   * sourceBullet:
   *   The original resume bullet.
   *
   * providedMetric:
   *   Optional verified evidence supplied by the user.
   */
  const handleRewrite = async (
    sourceBullet,
    providedMetric = "",
  ) => {
    const originalBullet = sourceBullet.trim();
    const supportingEvidence =
      providedMetric.trim();

    if (!originalBullet) {
      setError(
        "Please enter a resume bullet first.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      setSessionId(null);
      setJobId(null);
      setReviewData(null);
      setEvidenceAnalysis(null);

      setStatus("processing");

      console.log(
        "[Impact Rewriter] Sending original bullet:",
        originalBullet,
      );

      if (supportingEvidence) {
        console.log(
          "[Impact Rewriter] Sending supporting evidence:",
          supportingEvidence,
        );
      }

      const result = await createRewrite({
        bullet: originalBullet,
        metric: supportingEvidence,
        sessionId: null,
      });

      console.log(
        "[Impact Rewriter] Rewrite submitted:",
        result,
      );

      if (!result.jobId) {
        throw new Error(
          "The backend did not return a job ID.",
        );
      }

      setSessionId(result.sessionId);
      setJobId(result.jobId);

      await pollJob(
        result.jobId,
        supportingEvidence,
      );
    } catch (requestError) {
      console.error(
        "[Impact Rewriter] Rewrite error:",
        requestError,
      );

      setStatus("error");
      setLoading(false);
      setError(requestError.message);
    }
  };

  const handleInitialRewrite = async () => {
    setMetric("");

    await handleRewrite(bullet, "");
  };

  const handleMetricSubmit = async () => {
    const evidence = metric.trim();

    if (!evidence) {
      return;
    }

    await handleRewrite(bullet, evidence);
  };

  const handleApprove = async () => {
    if (
      !sessionId ||
      !jobId ||
      !reviewData?.changeId
    ) {
      setError(
        "Missing review information. Please start again.",
      );

      return;
    }

    if (evidenceAnalysis?.requiresEvidence) {
      setError(
        "This change requires supporting evidence before it can be approved.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      await reviewRewrite({
        sessionId,
        jobId,
        changeId: reviewData.changeId,
        approved: true,
      });

      setStatus("completed");
      setLoading(false);
    } catch (requestError) {
      setStatus("error");
      setLoading(false);
      setError(requestError.message);
    }
  };

  const handleReject = async () => {
    if (
      !sessionId ||
      !jobId ||
      !reviewData?.changeId
    ) {
      setError(
        "Missing review information. Please start again.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      await reviewRewrite({
        sessionId,
        jobId,
        changeId: reviewData.changeId,
        approved: false,
      });

      setStatus("rejected");
      setLoading(false);
    } catch (requestError) {
      setStatus("error");
      setLoading(false);
      setError(requestError.message);
    }
  };

  const reset = () => {
    setBullet("");
    setMetric("");
    setSessionId(null);
    setJobId(null);
    setReviewData(null);
    setEvidenceAnalysis(null);
    setStatus("idle");
    setLoading(false);
    setError("");
  };

  const showEvidenceQuestion =
    status === "review" &&
    reviewData &&
    evidenceAnalysis?.requiresEvidence;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={18} />
          </div>

          <div className="brand-copy">
            <span className="brand-name">
              Impact Bullet Rewriter
            </span>

            <span className="brand-subtitle">
              Evidence-safe resume editing
            </span>
          </div>
        </div>

        {(status !== "idle" || bullet) && (
          <button
            type="button"
            className="reset-button"
            onClick={reset}
          >
            <RotateCcw size={15} />
            Start over
          </button>
        )}
      </header>

      <main className="main">
        <section className="hero">
          <div className="eyebrow">
            <span className="eyebrow-icon">
              <FileCheck2 size={14} />
            </span>

            Evidence-preserving AI editing
          </div>

          <h1>
            Stronger bullets.{" "}
            <span>Truthful impact.</span>
          </h1>

          <p>
            Rewrite software engineering resume bullets
            into concise, outcome-focused statements
            without inventing achievements or metrics.
          </p>
        </section>

        <nav
          className="workflow"
          aria-label="Rewrite workflow"
        >
          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted =
              step.number < activeStep;

            const isActive =
              step.number === activeStep;

            return (
              <div
                className="workflow-item"
                key={step.label}
              >
                <div
                  className={[
                    "workflow-step",
                    isActive
                      ? "workflow-step-active"
                      : "",
                    isCompleted
                      ? "workflow-step-completed"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {isCompleted ? (
                    <Check size={13} />
                  ) : (
                    step.number
                  )}
                </div>

                <span
                  className={
                    isActive
                      ? "workflow-label workflow-label-active"
                      : "workflow-label"
                  }
                >
                  {step.label}
                </span>

                {index <
                  WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={[
                      "workflow-line",
                      isCompleted
                        ? "workflow-line-completed"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                )}
              </div>
            );
          })}
        </nav>

        <section className="workspace">
          {status === "idle" && (
            <BulletInput
              bullet={bullet}
              onChange={setBullet}
              onSubmit={handleInitialRewrite}
              loading={loading}
            />
          )}

          {status === "processing" && (
            <LoadingState />
          )}

          {status === "review" && reviewData && (
            <>
              <ReviewPanel
                original={reviewData.original}
                proposed={reviewData.proposed}
                explanation={
                  reviewData.explanation
                }
                onApprove={handleApprove}
                onReject={handleReject}
                loading={loading}
                evidenceRequired={Boolean(
                  evidenceAnalysis?.requiresEvidence,
                )}
              />

              {showEvidenceQuestion && (
                <MetricQuestion
                  metric={metric}
                  onChange={setMetric}
                  onSubmit={handleMetricSubmit}
                  loading={loading}
                  unsupportedClaims={
                    evidenceAnalysis?.unsupportedClaims ||
                    []
                  }
                />
              )}
            </>
          )}

          {status === "completed" && (
            <div className="success-card">
              <div className="success-icon">
                <FileCheck2 size={27} />
              </div>

              <span className="success-kicker">
                APPROVED
              </span>

              <h2>Change approved</h2>

              <p>
                Your reviewed resume bullet was
                successfully approved in SuperDocs.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={reset}
              >
                Rewrite another bullet
                <Sparkles size={16} />
              </button>
            </div>
          )}

          {status === "rejected" && (
            <div className="success-card rejected-card">
              <div className="success-icon rejected-icon">
                <RotateCcw size={27} />
              </div>

              <span className="success-kicker">
                REVIEWED
              </span>

              <h2>Change rejected</h2>

              <p>
                The proposed change was rejected and
                was not applied to the document.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={reset}
              >
                Try another bullet
                <RotateCcw size={16} />
              </button>
            </div>
          )}

          {error && (
            <div className="error-card">
              <div className="error-indicator" />

              <div>
                <strong>
                  Something went wrong
                </strong>

                <p>{error}</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;