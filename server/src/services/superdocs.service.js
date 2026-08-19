const SUPERDOCS_API_URL = "https://api.superdocs.app";

const getApiKey = () => {
  const apiKey = process.env.SUPERDOCS_API_KEY;

  if (!apiKey) {
    throw new Error("SUPERDOCS_API_KEY is not configured.");
  }

  return apiKey;
};

const parseResponse = async (response) => {
  const responseText = await response.text();

  let data;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.detail
        ? data.detail
        : `SuperDocs request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data;
};

const superdocsRequest = async (path, options = {}) => {
  const response = await fetch(`${SUPERDOCS_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  return parseResponse(response);
};

export const createRewriteJob = async ({
  message,
  sessionId,
  documentHtml,
}) => {
  return superdocsRequest("/v1/chat/async", {
    method: "POST",
    body: JSON.stringify({
      message,
      session_id: sessionId,
      document_html: documentHtml,
      approval_mode: "ask_every_time",
    }),
  });
};

export const getJobStatus = async (jobId) => {
  return superdocsRequest(`/v1/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: {},
  });
};

export const approveChanges = async ({
  sessionId,
  jobId,
  changeId,
  approved,
}) => {
  return superdocsRequest(
    `/v1/chat/${encodeURIComponent(sessionId)}/approve`,
    {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        change_id: changeId,
        approved,
      }),
    },
  );
};