import express from "express";
import { connect } from "../dbConfig/dbConfig";
import {
  getReportById,
  getAllReportsDebug,
  getDebugById,
} from "../controllers/reportsController";

const router = express.Router();

connect();

router.get("/reports/:id", getReportById);
router.get("/reports/debug/all", getAllReportsDebug);
router.get("/reports/debug/:id", getDebugById);

export default router;
