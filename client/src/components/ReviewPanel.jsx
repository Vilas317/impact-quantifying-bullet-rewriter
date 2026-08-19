import {
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const stripHtml = (html = "") => {
  const parser = new DOMParser();
  const document = parser.parseFromString(
    html,
    "text/html",
  );

  return document.body.textContent || "";
};

const ReviewPanel = ({
  original,
  proposed,
  explanation,
  onApprove,
  onReject,
  loading,
  evidenceRequired = false,
}) => {
  return (
    <section className="review-card">
      <div className="review-header">
        <div>
          <span className="section-label">
            Human review
          </span>

          <h2>Review the proposed change</h2>
        </div>

        <div
          className={
            evidenceRequired
              ? "warning-badge"
              : "verified-badge"
          }
        >
          {evidenceRequired ? (
            <ShieldAlert size={16} />
          ) : (
            <ShieldCheck size={16} />
          )}

          {evidenceRequired
            ? "Evidence required"
            : "Approval required"}
        </div>
      </div>

      <div className="comparison">
        <div className="comparison-block">
          <span className="comparison-label">
            Original
          </span>

          <p className="original-text">
            {original}
          </p>
        </div>

        <div className="comparison-block proposed-block">
          <span className="comparison-label">
            Proposed
          </span>

          <p className="proposed-text">
            {stripHtml(proposed)}
          </p>
        </div>
      </div>

      {explanation && (
        <div className="explanation">
          <strong>AI explanation</strong>

          <p>{explanation}</p>
        </div>
      )}

      {evidenceRequired ? (
        <div className="review-warning">
          <strong>
            This change cannot be approved yet.
          </strong>

          <span>
            The proposal contains an impact claim that is not
            supported by the source bullet. Add evidence or a
            verified metric below before approving.
          </span>
        </div>
      ) : (
        <div className="review-safe">
          <strong>
            No unsupported impact claim was detected.
          </strong>

          <span>
            You are still responsible for checking the
            proposed wording before approving it.
          </span>
        </div>
      )}

      <div className="review-actions">
        <button
          type="button"
          className="secondary-button reject-button"
          onClick={onReject}
          disabled={loading}
        >
          <XCircle size={17} />
          Reject
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={onApprove}
          disabled={loading || evidenceRequired}
          title={
            evidenceRequired
              ? "Add supporting evidence before approving this change."
              : ""
          }
        >
          <CheckCircle2 size={17} />

          {evidenceRequired
            ? "Evidence required"
            : loading
              ? "Processing..."
              : "Approve change"}
        </button>
      </div>
    </section>
  );
};

export default ReviewPanel;