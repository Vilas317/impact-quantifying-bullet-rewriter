import { Sparkles } from "lucide-react";

const LoadingState = () => {
  return (
    <div className="loading-card">
      <div className="spinner" />

      <div>
        <strong>
          Analyzing your bullet
        </strong>

        <p>
          SuperDocs is preparing an
          evidence-preserving rewrite.
        </p>
      </div>

      <Sparkles
        size={17}
        style={{
          marginLeft: "auto",
          color: "#7378ff",
          opacity: 0.7,
        }}
      />
    </div>
  );
};

export default LoadingState;