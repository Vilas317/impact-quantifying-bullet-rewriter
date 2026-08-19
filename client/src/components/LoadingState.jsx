const LoadingState = () => {
  return (
    <div className="loading-card">
      <div className="spinner" />

      <div>
        <strong>Analyzing your bullet</strong>

        <p>
          SuperDocs is preparing an evidence-preserving rewrite.
        </p>
      </div>
    </div>
  );
};

export default LoadingState;