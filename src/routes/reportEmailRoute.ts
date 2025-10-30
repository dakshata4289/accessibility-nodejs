import express from "express";
import { sendAccessibilityReport } from "../controllers/reportEmailController";

const router = express.Router();

// POST /api/send-report
router.post("/send-report", sendAccessibilityReport);

export default router;
