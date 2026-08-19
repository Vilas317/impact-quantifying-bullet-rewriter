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
const MAX_POLLS = 60;

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
   * When preserveReview is true, an existing valid
   * review screen remains available if the new
   * evidence-backed rewrite fails or times out.
   */
  const pollJob = async (
    newJobId,
    supportingEvidence = "",
    preserveReview = false,
    previousReviewData = null,
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
            stripHtml(firstChange.new_html || "");

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
          setError("");

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

        setLoading(false);

        /*
         * If this was an evidence-backed rewrite and
         * the new job failed, keep the previous review
         * available instead of forcing the user back
         * to the beginning.
         */
        if (
          preserveReview &&
          previousReviewData
        ) {
          setReviewData(previousReviewData);
          setStatus("review");
        } else {
          setStatus("error");
        }

        setError(
          requestError?.message ||
            "The rewrite could not be completed.",
        );

        return;
      }
    }

    setLoading(false);

    /*
     * A timeout should not destroy the existing review
     * when the user is submitting evidence.
     */
    if (
      preserveReview &&
      previousReviewData
    ) {
      setReviewData(previousReviewData);
      setStatus("review");
    } else {
      setStatus("error");
    }

    setError(
      "The rewrite is taking longer than expected. SuperDocs may still be processing it. Please wait a little longer and try again.",
    );
  };

  /*
   * sourceBullet:
   *   The original resume bullet.
   *
   * providedMetric:
   *   Optional verified evidence supplied by the user.
   *
   * preserveExistingReview:
   *   Used when the user submits evidence from the
   *   review screen. The previous review remains visible
   *   if the new evidence-backed rewrite fails.
   *
   * IMPORTANT:
   *   Evidence-backed rewrites intentionally use a NEW
   *   SuperDocs session. The previous session is already
   *   waiting for human approval and cannot accept another
   *   async rewrite request.
   */
  const handleRewrite = async (
    sourceBullet,
    providedMetric = "",
    preserveExistingReview = false,
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

    /*
     * Save the current review before starting an
     * evidence-backed rewrite.
     *
     * We deliberately DO NOT reuse the current
     * SuperDocs session.
     */
    const existingReviewData =
      preserveExistingReview
        ? reviewData
        : null;

    try {
      setLoading(true);
      setError("");

      /*
       * For a normal rewrite, clear the previous state.
       *
       * For an evidence-backed rewrite, preserve the
       * existing review until the new job succeeds.
       */
      if (!preserveExistingReview) {
        setSessionId(null);
        setJobId(null);
        setReviewData(null);
        setEvidenceAnalysis(null);
      }

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

      if (preserveExistingReview) {
        console.log(
          "[Impact Rewriter] Evidence-backed rewrite will use a NEW SuperDocs session.",
        );
      }

      /*
       * IMPORTANT:
       *
       * Do not pass the existing sessionId here when
       * generating an evidence-backed rewrite.
       *
       * Passing the existing session caused:
       *
       *   error_code: "session_busy"
       *
       * because the original job is still waiting for
       * human approval.
       *
       * Passing null makes the backend create a new
       * session for this independent rewrite attempt.
       */
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

      /*
       * Once the new job has successfully been created,
       * replace the job/session state with the new job.
       */
      setSessionId(result.sessionId);
      setJobId(result.jobId);

      await pollJob(
        result.jobId,
        supportingEvidence,
        Boolean(
          preserveExistingReview &&
            existingReviewData,
        ),
        existingReviewData,
      );
    } catch (requestError) {
      console.error(
        "[Impact Rewriter] Rewrite error:",
        requestError,
      );

      setLoading(false);

      if (
        preserveExistingReview &&
        existingReviewData
      ) {
        setReviewData(existingReviewData);
        setStatus("review");
      } else {
        setStatus("error");
      }

      setError(
        requestError?.message ||
          "The rewrite could not be completed.",
      );
    }
  };

  const handleInitialRewrite = async () => {
    setMetric("");

    await handleRewrite(
      bullet,
      "",
      false,
    );
  };

  const handleMetricSubmit = async () => {
    const evidence = metric.trim();

    if (!evidence) {
      return;
    }

    /*
     * Evidence submission happens from the review page.
     *
     * A NEW SuperDocs session is intentionally created
     * for this request because the original session is
     * already waiting for human approval.
     */
    await handleRewrite(
      bullet,
      evidence,
      true,
    );
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

    if (
      evidenceAnalysis?.requiresEvidence
    ) {
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

      setError(
        requestError?.message ||
          "The change could not be approved.",
      );
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

      setError(
        requestError?.message ||
          "The change could not be rejected.",
      );
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