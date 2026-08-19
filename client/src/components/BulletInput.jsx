import {
  ArrowRight,
  FileText,
  Sparkles,
} from "lucide-react";

const BulletInput = ({
  bullet,
  onChange,
  onSubmit,
  loading,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!bullet.trim() || loading) {
      return;
    }

    onSubmit();
  };

  return (
    <form
      className="input-card"
      onSubmit={handleSubmit}
    >
      <div className="section-label">
        <FileText size={16} />
        Resume bullet
      </div>

      <textarea
        value={bullet}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="Example: Developed REST APIs using Node.js and Express."
        rows={5}
        maxLength={500}
        disabled={loading}
      />

      <div className="input-footer">
        <span>{bullet.length}/500</span>

        <button
          type="submit"
          className="primary-button"
          disabled={!bullet.trim() || loading}
        >
          {loading ? (
            "Analyzing..."
          ) : (
            <>
              Rewrite bullet
              <ArrowRight size={17} />
            </>
          )}

          {!loading && (
            <Sparkles
              size={14}
              className="button-sparkle"
            />
          )}
        </button>
      </div>
    </form>
  );
};

export default BulletInput;