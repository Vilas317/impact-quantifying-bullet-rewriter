import { Router } from "express";
import {
  createRewrite,
  getRewriteStatus,
  reviewRewrite,
} from "../controllers/rewrite.controller.js";

const router = Router();

router.post("/", createRewrite);
router.get("/jobs/:jobId", getRewriteStatus);
router.post("/:sessionId/review", reviewRewrite);

export default router;