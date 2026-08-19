import { buildRewritePrompt } from "../prompts/rewrite.prompt.js";
import {
  approveChanges,
  createRewriteJob,
  getJobStatus,
} from "../services/superdocs.service.js";

const createSessionId = () => {
  return `bullet-rewrite-${Date.now()}`;
};

export const createRewrite = async (req, res, next) => {
  try {
    const { bullet, metric, sessionId } = req.body;

    if (!bullet || typeof bullet !== "string" || !bullet.trim()) {
      return res.status(400).json({
        message: "A resume bullet is required.",
      });
    }

    const documentHtml = `<p>${escapeHtml(bullet.trim())}</p>`;

    const message = buildRewritePrompt({
      bullet: bullet.trim(),
      metric: typeof metric === "string" ? metric.trim() : "",
    });

    const resolvedSessionId = sessionId || createSessionId();

    const job = await createRewriteJob({
      message,
      sessionId: resolvedSessionId,
      documentHtml,
    });

    return res.status(202).json({
      sessionId: resolvedSessionId,
      jobId: job.job_id,
      status: "submitted",
    });
  } catch (error) {
    next(error);
  }
};

export const getRewriteStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await getJobStatus(jobId);

    return res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};

export const reviewRewrite = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { jobId, changeId, approved } = req.body;

    if (!jobId) {
      return res.status(400).json({
        message: "jobId is required.",
      });
    }

    if (!changeId) {
      return res.status(400).json({
        message: "changeId is required.",
      });
    }

    if (typeof approved !== "boolean") {
      return res.status(400).json({
        message: "approved must be a boolean.",
      });
    }

    const result = await approveChanges({
      sessionId,
      jobId,
      changeId,
      approved,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const escapeHtml = (value) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};