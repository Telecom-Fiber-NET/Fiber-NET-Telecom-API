import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";
import { verifyToken } from "../../middleware/authMiddleware";

const router = Router();

router.get("/", verifyToken, getDashboard);

export default router;