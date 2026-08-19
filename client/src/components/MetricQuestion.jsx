import {
  BarChart3,
  ShieldAlert,
} from "lucide-react";

const MetricQuestion = ({
  metric,
  onChange,
  onSubmit,
  loading,
  unsupportedClaims = [],
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!metric.trim() || loading) {
      return;
    }

    onSubmit();
  };

  return (
    <section className="metric-card">
      <div className="metric-heading">
        <div className="metric-icon">
          <ShieldAlert size={19} />
        </div>

        <div>
          <h3>
            Evidence required before approval
          </h3>

          <p>
            The proposed rewrite contains claims
            that are not supported by the original
            bullet.
          </p>
        </div>
      </div>

      {unsupportedClaims.length > 0 && (
        <div className="claim-list">
          <span className="claim-list-title">
            Claims needing evidence
          </span>

          <div className="claim-tags">
            {unsupportedClaims.map((claim) => (
              <span
                className="claim-tag"
                key={claim}
              >
                {claim}
              </span>
            ))}
          </div>
        </div>
      )}

      <label htmlFor="metric">
        Add a real metric or supporting evidence
      </label>

      <input
        id="metric"
        type="text"
        value={metric}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Example: handled 10,000 requests/day with 99.9% uptime"
        maxLength={500}
        disabled={loading}
      />

      <p className="metric-help">
        Only provide information that is true
        and that you can support from your actual
        experience.
      </p>

      <button
        type="button"
        className="primary-button"
        onClick={handleSubmit}
        disabled={!metric.trim() || loading}
      >
        <BarChart3 size={16} />

        {loading
          ? "Generating revised bullet..."
          : "Generate evidence-backed bullet"}
      </button>
    </section>
  );
};

export default MetricQuestion;