import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { connect } from "./dbConfig/dbConfig";
import scanRoute from "./routes/scanRoute";
import reportsRoute from "./routes/reportsRoute";
import reportEmailRoute from "./routes/reportEmailRoute";
import userRoute from "./routes/userRoute";

// Load environment variables
dotenv.config();

// Connect to the database
connect();

const app = express();
app.use(cors());
app.use(express.json());

// 🧱 API Routes
app.use("/api", scanRoute);
app.use("/api", reportsRoute);
app.use("/api", reportEmailRoute);
app.use("/api", userRoute);

// 🩺 Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "Accessibility Scanner API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// 🌐 Serve Frontend (React build)
const frontendPath = path.join(__dirname, "../src/frontend/dist");

// Serve static files from React build
app.use(express.static(frontendPath));

// SPA fallback — send index.html for all non-API routes
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.resolve(frontendPath, "index.html"));
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
