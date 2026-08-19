const SUPERDOCS_API_URL = "https://api.superdocs.app";

const getApiKey = () => {
  const apiKey = process.env.SUPERDOCS_API_KEY;

  if (!apiKey) {
    throw new Error("SUPERDOCS_API_KEY is not configured.");
  }

  return apiKey;
};

const parseResponse = async (response, path) => {
  const responseText = await response.text();

  let data;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
  console.error("[SuperDocs] API error:", {
    path,
    status: response.status,
    statusText: response.statusText,
    response: data,
  });

  let message;

  if (typeof data === "string") {
    message = data;
  } else if (data?.detail) {
    message =
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail);
  } else if (data?.message) {
    message =
      typeof data.message === "string"
        ? data.message
        : JSON.stringify(data.message);
  } else if (data?.error) {
    message =
      typeof data.error === "string"
        ? data.error
        : JSON.stringify(data.error);
  } else if (data) {
    message = JSON.stringify(data);
  }

  console.error("========== SUPERDOCS DEBUG ==========");
  console.error("STATUS:", response.status);
  console.error("DATA:", data);
  console.error("DETAIL TYPE:", typeof data?.detail);
  console.error("MESSAGE:", message);
  console.error("====================================");

  throw new Error(
    message ||
      `SuperDocs request failed with status ${response.status}.`,
  );
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

  return parseResponse(response, path);
};

export const createRewriteJob = async ({
  message,
  sessionId,
  documentHtml,
}) => {
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("A valid session ID is required.");
  }

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
  return superdocsRequest(
    `/v1/jobs/${encodeURIComponent(jobId)}`,
    {
      method: "GET",
      headers: {},
    },
  );
};

export const approveChanges = async ({
  sessionId,
  jobId,
  changeId,
  approved,
}) => {
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("A valid session ID is required.");
  }

  return superdocsRequest(
    `/v1/chat/${encodeURIComponent(sessionId)}/approve`,
    {
      method: "POST",
      body: JSON.stringify({
        job_id: jobId,
        approved,
        changes: [
          {
            change_id: changeId,
            approved,
          },
        ],
      }),
    },
  );
};