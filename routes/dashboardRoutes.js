import express from 'express';
const router = express.Router();
import { getDashboardOverview } from '../controllers/dashboardController.js';
import { getAllRequests } from "../controllers/requestController.js";

router.get('/dashboard-overview', getDashboardOverview);

router.get("/all-requests", getAllRequests);

export default router;
