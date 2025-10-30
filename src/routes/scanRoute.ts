import express from "express";
import { scanWebsite } from "../controllers/scanController";

const router = express.Router();

router.post("/scan", scanWebsite);

export default router;
