import express from "express";
import cors from "cors";
import rewriteRoutes from "./routes/rewrite.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/rewrite", rewriteRoutes);

app.use(errorMiddleware);

export default app;