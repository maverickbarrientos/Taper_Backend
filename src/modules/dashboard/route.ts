import { Router } from "express";
import { prisma } from "../../database/prisma";
import { DashboardService } from "./service";
import { DashboardController } from "./controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAthlete } from "../../middleware/requireAthlete";
import { requireCoach } from "../../middleware/requireCoach";

const router = Router();
const service = new DashboardService(prisma);
const controller = new DashboardController(service);

router.get('/me/progress', requireAuth, requireAthlete, controller.getMyProgress.bind(controller));

router.use(requireAuth, requireCoach);

router.get('/overview', controller.getOverview.bind(controller));
router.get('/athletes', controller.getAthletes.bind(controller));
router.get('/trend', controller.getTrend.bind(controller));

export default router
