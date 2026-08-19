const API_BASE_URL =
  "https://impact-quantifying-bullet-rewriter.onrender.com/api";

const request = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `Request failed with status ${response.status}.`,
    );
  }

  return data;
};

export const createRewrite = async ({
  bullet,
  metric = "",
  sessionId = null,
}) => {
  return request("/rewrite", {
    method: "POST",
    body: JSON.stringify({
      bullet,
      metric,
      sessionId,
    }),
  });
};

export const getRewriteStatus = async (jobId) => {
  return request(`/rewrite/jobs/${encodeURIComponent(jobId)}`);
};

export const reviewRewrite = async ({
  sessionId,
  jobId,
  changeId,
  approved,
}) => {
  return request(`/rewrite/${encodeURIComponent(sessionId)}/review`, {
    method: "POST",
    body: JSON.stringify({
      jobId,
      changeId,
      approved,
    }),
  });
};